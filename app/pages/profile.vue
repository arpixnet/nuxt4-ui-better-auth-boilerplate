<script setup lang="ts">
import { useAuthClient } from '~/lib/auth-client'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import { useI18n } from '#imports'

definePageMeta({
    middleware: 'auth',
    requiresAuth: true
})

const { t } = useI18n()

const { session, pending, refresh } = useAuthSession()
const authClient = useAuthClient()
const toast = useToast()

// Form states
const isEditingProfile = ref(false)
const isChangingPassword = ref(false)
const loadingProfile = ref(false)
const loadingPassword = ref(false)

// Profile form
const profileForm = ref({
    name: '',
    email: ''
})

// Password form
const passwordForm = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

// Password validation
const passwordsMatch = computed(() => {
    if (!passwordForm.value.newPassword || !passwordForm.value.confirmPassword) return true
    return passwordForm.value.newPassword === passwordForm.value.confirmPassword
})

const confirmPasswordError = computed(() => {
    if (passwordForm.value.confirmPassword && !passwordsMatch.value) {
        return t('profile.validation.passwordNotMatch')
    }
    return null
})

// 2FA State
const twoFactorEnabled = ref(false)
const showTwoFactorModal = ref(false)
const twoFactorStep = ref<'confirm-password' | 'scan-qr'>('confirm-password')
const twoFactorData = ref<{ secret: string, totpURI: string, backupCodes: string[] } | null>(null)
const twoFactorPassword = ref('')
const twoFactorVerifyCode = ref<string[]>([])
const loadingTwoFactor = ref(false)
const showDisableTwoFactorModal = ref(false)
const disableTwoFactorPassword = ref('')

// Active Sessions State
const sessions = ref<any[]>([])
const loadingSessions = ref(false)
const showSessionsModal = ref(false)
const revokingSessionId = ref<string | null>(null)
const showRevokeAllModal = ref(false)

// Delete Account State
const loadingDelete = ref(false)
const showDeleteAccountModal = ref(false)
const deleteAccountPassword = ref('')

// Initialize profile data and check 2FA status
watch(() => session.value.data?.user, (user) => {
    if (user) {
        profileForm.value.name = user.name || ''
        profileForm.value.email = user.email
        // Check if 2FA is enabled (property depends on Better-Auth user object extension)
        twoFactorEnabled.value = (user as any).twoFactorEnabled || false
    }
}, { immediate: true })

// Update Profile
const updateProfile = async () => {
    loadingProfile.value = true

    try {
        const { error } = await authClient.updateUser({
            name: profileForm.value.name
        })

        if (error) throw error

        // Refresh session to reflect updated user data
        await refresh()

        toast.add({
            title: t('profile.toasts.success'),
            description: t('profile.toasts.profileUpdated'),
            color: 'success'
        })

        isEditingProfile.value = false
    } catch (error: any) {
        toast.add({
            title: t('profile.toasts.error'),
            description: error.message || t('profile.errors.updateProfile'),
            color: 'error'
        })
    } finally {
        loadingProfile.value = false
    }
}

// Change Password
const changePassword = async () => {
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
        toast.add({
            title: t('profile.toasts.error'),
            description: t('profile.validation.passwordNotMatch'),
            color: 'error'
        })
        return
    }

    if (passwordForm.value.newPassword.length < 8) {
        toast.add({
            title: t('profile.toasts.error'),
            description: 'Password must be at least 8 characters',
            color: 'error'
        })
        return
    }

    loadingPassword.value = true

    try {
        const { error } = await authClient.changePassword({
            currentPassword: passwordForm.value.currentPassword,
            newPassword: passwordForm.value.newPassword,
            revokeOtherSessions: true
        })

        if (error) throw error

        toast.add({
            title: t('profile.toasts.success'),
            description: t('profile.toasts.passwordChanged'),
            color: 'success'
        })

        isChangingPassword.value = false
        passwordForm.value = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        }
    } catch (error: any) {
        toast.add({
            title: t('profile.toasts.error'),
            description: error.message || t('profile.errors.changePassword'),
            color: 'error'
        })
    } finally {
        loadingPassword.value = false
    }
}

// Cancel edit
const cancelEdit = () => {
    isEditingProfile.value = false
    if (session.value.data?.user) {
        profileForm.value.name = session.value.data.user.name || ''
        profileForm.value.email = session.value.data.user.email
    }
}

// Cancel password change
const cancelPasswordChange = () => {
    isChangingPassword.value = false
    passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    }
}

// 2FA Handlers
const initiateTwoFactor = () => {
    twoFactorStep.value = 'confirm-password'
    twoFactorPassword.value = ''
    twoFactorVerifyCode.value = []
    twoFactorData.value = null
    showTwoFactorModal.value = true
}

const enableTwoFactor = async () => {
    loadingTwoFactor.value = true
    try {
        const response = await authClient.twoFactor.enable({
            password: twoFactorPassword.value
        })

        if (response.data) {
            twoFactorData.value = response.data
            twoFactorStep.value = 'scan-qr'
        } else {
            throw new Error(response.error?.message || 'Failed to generate 2FA secret')
        }
    } catch (error: any) {
        toast.add({
            title: t('profile.toasts.error'),
            description: error.message || t('profile.errors.incorrectPassword'),
            color: 'error'
        })
    } finally {
        loadingTwoFactor.value = false
    }
}

const verifyTwoFactor = async () => {
    loadingTwoFactor.value = true
    try {
        const response = await authClient.twoFactor.verifyTotp({
            code: twoFactorVerifyCode.value.join(''),
            trustDevice: false
        })

        if (response.data) {
            twoFactorEnabled.value = true
            showTwoFactorModal.value = false
            toast.add({
                title: t('profile.toasts.success'),
                description: t('profile.toasts.twoFactorEnabled'),
                color: 'success'
            })
            // Ideally show backup codes here again or confusing user?
            // User should have saved them in previous step if we displayed them.
        } else {
            throw new Error(response.error?.message || 'Invalid code')
        }
    } catch (error: any) {
        toast.add({
            title: t('profile.toasts.error'),
            description: error.message || t('profile.errors.invalidCode'),
            color: 'error'
        })
    } finally {
        loadingTwoFactor.value = false
    }
}

const initiateDisableTwoFactor = () => {
    disableTwoFactorPassword.value = ''
    showDisableTwoFactorModal.value = true
}

const confirmDisableTwoFactor = async () => {
    loadingTwoFactor.value = true
    try {
        const response = await authClient.twoFactor.disable({
            password: disableTwoFactorPassword.value
        })

        if (response.error) {
            throw new Error(response.error.message)
        }

        twoFactorEnabled.value = false
        showDisableTwoFactorModal.value = false
        toast.add({
            title: t('profile.toasts.success'),
            description: t('profile.toasts.twoFactorDisabled'),
            color: 'success'
        })
    } catch (error: any) {
        toast.add({
            title: t('profile.toasts.error'),
            description: error.message || t('profile.errors.disable2FA'),
            color: 'error'
        })
    } finally {
        loadingTwoFactor.value = false
    }
}


// Active Sessions Handlers
const openSessionsModal = async () => {
    showSessionsModal.value = true
    await fetchSessions()
}

const fetchSessions = async () => {
    loadingSessions.value = true
    try {
        const response = await authClient.listSessions()
        if (response.data) {
            sessions.value = response.data
        }
    } catch (error: any) {
        toast.add({
            title: t('profile.toasts.error'),
            description: t('profile.errors.loadSessions'),
            color: 'error'
        })
    } finally {
        loadingSessions.value = false
    }
}

const revokeSession = async (token: string) => {
    revokingSessionId.value = token
    try {
        const response = await authClient.revokeSession({
            token // Pass the token of the session to revoke
        })

        if (response.error) throw response.error

        toast.add({
            title: t('profile.toasts.success'),
            description: t('profile.toasts.sessionRevoked'),
            color: 'success'
        })

        // Refresh list
        await fetchSessions()
    } catch (error: any) {
        toast.add({
            title: t('profile.toasts.error'),
            description: error.message || t('profile.errors.revokeSession'),
            color: 'error'
        })
    } finally {
        revokingSessionId.value = null
    }
}

const revokeOtherSessions = async () => {
    showRevokeAllModal.value = true
}

const confirmRevokeAllSessions = async () => {
    try {
        const currentToken = session.value.data?.session.token
        const others = sessions.value.filter(s => s.token !== currentToken)

        const promises = others.map(s => authClient.revokeSession({ token: s.token }))
        await Promise.all(promises)

        toast.add({
            title: t('profile.toasts.success'),
            description: t('profile.toasts.allSessionsRevoked'),
            color: 'success'
        })
        showRevokeAllModal.value = false
        await fetchSessions()
    } catch (error: any) {
        toast.add({
            title: t('profile.toasts.error'),
            description: t('profile.errors.revokeAllSessions'),
            color: 'error'
        })
    }
}

// Delete Account Handler
const deleteAccount = async () => {
    showDeleteAccountModal.value = true
}

const confirmDeleteAccount = async () => {
    loadingDelete.value = true
    try {
        const response = await authClient.deleteUser()

        if (response.error) throw response.error

        toast.add({
            title: t('profile.toasts.success'),
            description: t('profile.toasts.accountDeleted'),
            color: 'success'
        })

        // Redirect to home/login
        window.location.href = '/'
    } catch (error: any) {
        toast.add({
            title: t('profile.toasts.error'),
            description: error.message || t('profile.errors.deleteAccount'),
            color: 'error'
        })
    } finally {
        loadingDelete.value = false
        showDeleteAccountModal.value = false
    }
}

const getSessionDeviceName = (userAgent?: string) => {
    if (!userAgent) return t('profile.deviceNames.unknown')
    if (userAgent.includes('Mac')) return t('profile.deviceNames.macOS')
    if (userAgent.includes('Windows')) return t('profile.deviceNames.windows')
    if (userAgent.includes('Android')) return t('profile.deviceNames.android')
    if (userAgent.includes('iPhone')) return t('profile.deviceNames.iphone')
    if (userAgent.includes('Linux')) return t('profile.deviceNames.linux')
    return t('profile.deviceNames.device')
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Header -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ t('profile.title') }}</h1>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {{ t('profile.subtitle') }}
                </p>
            </div>

            <!-- Loading State -->
            <div v-if="pending" class="flex items-center justify-center py-12">
                <div class="flex flex-col items-center gap-4">
                    <div class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin">
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('profile.loading') }}</p>
                </div>
            </div>

            <!-- Profile Content -->
            <div v-else-if="session.data?.user" class="space-y-6">
                <!-- Profile Information Card -->
                <UCard>
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{{ t('profile.profileInfo') }}</h2>
                            <UButton v-if="!isEditingProfile" @click="isEditingProfile = true" color="primary"
                                variant="soft" size="sm">
                                {{ t('profile.editProfile') }}
                            </UButton>
                        </div>
                    </template>

                    <div v-if="!isEditingProfile" class="space-y-4">
                        <div>
                            <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('profile.username') }}</label>
                            <p class="mt-1 text-base text-gray-900 dark:text-white">
                                {{ session.data.user.name || t('profile.notSet') }}
                            </p>
                        </div>

                        <div>
                            <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('profile.email') }}</label>
                            <p class="mt-1 text-base text-gray-900 dark:text-white">
                                {{ session.data.user.email }}
                            </p>
                        </div>

                        <div>
                            <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('profile.emailVerified') }}</label>
                            <div class="mt-1 flex items-center gap-2">
                                <UBadge :color="session.data.user.emailVerified ? 'success' : 'warning'">
                                    {{ session.data.user.emailVerified ? t('profile.verified') : t('profile.notVerified') }}
                                </UBadge>
                            </div>
                        </div>

                        <div>
                            <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('profile.memberSince') }}</label>
                            <p class="mt-1 text-base text-gray-900 dark:text-white">
                                {{ new Date(session.data.user.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) }}
                            </p>
                        </div>
                    </div>

                    <!-- Edit Form -->
                    <div v-else class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {{ t('profile.username') }}
                            </label>
                            <UInput v-model="profileForm.name" type="text" placeholder="Enter your name" size="lg" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {{ t('profile.email') }}
                            </label>
                            <UInput v-model="profileForm.email" type="email" placeholder="Enter your email" size="lg"
                                disabled />
                            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {{ t('profile.emailNotChangeable') }}
                            </p>
                        </div>

                        <div class="flex gap-3 pt-4">
                            <UButton @click="updateProfile" :loading="loadingProfile" color="primary">
                                {{ t('profile.saveChanges') }}
                            </UButton>
                            <UButton @click="cancelEdit" color="neutral" variant="soft">
                                {{ t('profile.cancel') }}
                            </UButton>
                        </div>
                    </div>
                </UCard>

                <!-- Change Password Card -->
                <UCard>
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{{ t('profile.changePassword') }}</h2>
                            <UButton v-if="!isChangingPassword" @click="isChangingPassword = true" color="primary"
                                variant="soft" size="sm">
                                {{ t('profile.changePassword') }}
                            </UButton>
                        </div>
                    </template>

                    <div v-if="!isChangingPassword">
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            {{ t('profile.passwordDescription') }}
                        </p>
                    </div>

                    <div v-else class="space-y-4">
                        <UPassword
                            v-model="passwordForm.currentPassword"
                            :label="t('profile.currentPassword')"
                            placeholder="Enter current password"
                            :disabled="loadingPassword"
                            class="mb-4"
                        />

                        <UPassword
                            v-model="passwordForm.newPassword"
                            :label="t('profile.newPassword')"
                            placeholder="Enter new password"
                            :disabled="loadingPassword"
                            show-validation
                            class="mb-4"
                        />

                        <UPassword
                            v-model="passwordForm.confirmPassword"
                            :label="t('profile.confirmPassword')"
                            placeholder="Confirm new password"
                            :disabled="loadingPassword"
                            :error="!!(passwordForm.confirmPassword && !passwordsMatch)"
                            :error-message="confirmPasswordError"
                            class="mb-4"
                        />

                        <div class="flex gap-3 pt-4">
                            <UButton @click="changePassword" :loading="loadingPassword" color="primary">
                                {{ t('profile.updatePassword') }}
                            </UButton>
                            <UButton @click="cancelPasswordChange" color="neutral" variant="soft">
                                {{ t('profile.cancel') }}
                            </UButton>
                        </div>
                    </div>
                </UCard>

                <!-- Security Card -->
                <UCard>
                    <template #header>
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{{ t('profile.security') }}</h2>
                    </template>

                    <div class="space-y-4">
                        <div
                            class="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 class="text-sm font-medium text-gray-900 dark:text-white">{{ t('profile.twoFactorAuth') }}
                                </h3>
                                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {{ t('profile.twoFactorDescription') }}
                                </p>
                            </div>
                            <div class="flex items-center gap-3">
                                <UBadge v-if="twoFactorEnabled" color="success" variant="subtle">{{ t('profile.enabled') }}</UBadge>
                                <UButton :color="twoFactorEnabled ? 'error' : 'primary'"
                                    :variant="twoFactorEnabled ? 'soft' : 'solid'" size="sm"
                                    @click="twoFactorEnabled ? initiateDisableTwoFactor() : initiateTwoFactor()"
                                    :loading="loadingTwoFactor">
                                    {{ twoFactorEnabled ? t('profile.disable') : t('profile.enable') }}
                                </UButton>
                            </div>
                        </div>

                        <div class="flex items-center justify-between py-3">
                            <div>
                                <h3 class="text-sm font-medium text-gray-900 dark:text-white">{{ t('profile.activeSessions') }}</h3>
                                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {{ t('profile.sessionsDescription') }}
                                </p>
                            </div>
                            <UButton color="neutral" variant="soft" size="sm" @click="openSessionsModal">
                                {{ t('profile.viewSessions') }}
                            </UButton>
                        </div>
                    </div>
                </UCard>

                <!-- Danger Zone -->
                <UCard>
                    <template #header>
                        <h2 class="text-xl font-semibold text-red-600 dark:text-red-400">{{ t('profile.dangerZone') }}</h2>
                    </template>

                    <div class="space-y-4">
                        <div
                            class="flex items-center justify-between py-3 border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
                            <div>
                                <h3 class="text-sm font-medium text-red-900 dark:text-red-100">{{ t('profile.deleteAccount') }}</h3>
                                <p class="text-sm text-red-600 dark:text-red-400 mt-1">
                                    {{ t('profile.deleteDescription') }}
                                </p>
                            </div>
                            <UButton color="error" variant="soft" size="sm" @click="deleteAccount"
                                :loading="loadingDelete">
                                {{ t('profile.deleteAccountButton') }}
                            </UButton>
                        </div>
                    </div>
                </UCard>
            </div>
        </div>

        <!-- 2FA Setup Modal -->
        <UModal v-model:open="showTwoFactorModal"
            :title="twoFactorStep === 'confirm-password' ? t('profile.modals.twoFactor.confirmPasswordTitle') : t('profile.modals.twoFactor.scanQrTitle')"
            :description="twoFactorStep === 'confirm-password' ? t('profile.modals.twoFactor.confirmPasswordDesc') : t('profile.modals.twoFactor.scanQrDesc')">

            <template #body>
                <div v-if="twoFactorStep === 'confirm-password'" class="space-y-4">
                    <UPassword
                        v-model="twoFactorPassword"
                        :label="t('profile.modals.twoFactor.confirmPassword')"
                        placeholder="Confirm your password"
                        :disabled="loadingTwoFactor"
                        @keyup.enter="enableTwoFactor"
                        class="w-full"
                    />
                </div>

                <div v-else-if="twoFactorStep === 'scan-qr' && twoFactorData" class="space-y-4">
                    <div class="space-y-2">
                        <div class="flex justify-center p-4 bg-white rounded-lg">
                            <VueQrcode :value="twoFactorData.totpURI" :options="{ width: 200, margin: 2 }" />
                        </div>
                    </div>

                    <div class="space-y-2 flex flex-col items-center">
                        <p class="text-center text-sm text-gray-600 dark:text-gray-300">
                            {{ t('profile.modals.twoFactor.enterCode') }}
                        </p>
                        <UPinInput v-model="twoFactorVerifyCode" :length="6" type="text" otp :autofocus="true"
                            :disabled="loadingTwoFactor" :color="twoFactorVerifyCode.length === 6 ? 'success' : undefined"
                            placeholder="•" />
                    </div>
                </div>
            </template>

            <template #footer>
                <div class="flex justify-end gap-2 w-full">
                    <UButton color="neutral" variant="ghost" @click="showTwoFactorModal = false">{{ t('profile.cancel') }}</UButton>

                    <UButton v-if="twoFactorStep === 'confirm-password'" color="primary" @click="enableTwoFactor"
                        :loading="loadingTwoFactor" :disabled="!twoFactorPassword">
                        {{ t('profile.modals.twoFactor.continue') }}
                    </UButton>

                    <UButton v-else color="primary" @click="verifyTwoFactor" :loading="loadingTwoFactor"
                        :disabled="!twoFactorVerifyCode || twoFactorVerifyCode.length < 6">
                        {{ t('profile.modals.twoFactor.verifyAndActivate') }}
                    </UButton>
                </div>
            </template>
        </UModal>

        <!-- Disable 2FA Modal -->
        <UModal v-model:open="showDisableTwoFactorModal" :title="t('profile.modals.disableTwoFactor.title')"
            :description="t('profile.modals.disableTwoFactor.description')">
            <template #body>
                <div class="space-y-4">
                    <UPassword
                        v-model="disableTwoFactorPassword"
                        :label="t('profile.modals.disableTwoFactor.confirmPassword')"
                        placeholder="Confirm your password"
                        :disabled="loadingTwoFactor"
                        @keyup.enter="confirmDisableTwoFactor"
                        class="w-full"
                    />
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2 w-full">
                    <UButton color="neutral" variant="ghost" @click="showDisableTwoFactorModal = false">{{ t('profile.cancel') }}</UButton>
                    <UButton color="error" @click="confirmDisableTwoFactor" :loading="loadingTwoFactor" :disabled="!disableTwoFactorPassword">
                        {{ t('profile.modals.disableTwoFactor.disable2FA') }}
                    </UButton>
                </div>
            </template>
        </UModal>

        <!-- Active Sessions Modal -->
        <UModal v-model:open="showSessionsModal" :title="t('profile.modals.sessions.title')"
            :description="t('profile.modals.sessions.description')">
            <template #body>
                <div class="space-y-4">
                    <UButton v-if="sessions.length > 1" color="error" variant="soft" size="xs" class="mb-2"
                        @click="revokeOtherSessions">
                        {{ t('profile.modals.sessions.revokeAll') }}
                    </UButton>

                    <div v-if="sessions.length === 0 && !loadingSessions" class="text-center py-4 text-gray-500">
                        {{ t('profile.modals.sessions.noSessions') }}
                    </div>

                    <div v-else class="space-y-3">
                        <div v-for="sess in sessions" :key="sess.id"
                            class="flex items-start justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <div class="flex gap-3">
                                <div class="mt-1">
                                    <UIcon
                                        :name="sess.userAgent?.includes('Mobile') ? 'heroicons:device-phone-mobile' : 'heroicons:computer-desktop'"
                                        class="w-5 h-5 text-gray-400" />
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm font-medium text-gray-900 dark:text-white">
                                            {{ getSessionDeviceName(sess.userAgent) }}
                                        </span>
                                        <UBadge v-if="sess.isCurrent" color="success" variant="subtle" size="xs">{{ t('profile.modals.sessions.current') }}
                                        </UBadge>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1 truncate max-w-50"
                                        :title="sess.userAgent">
                                        {{ sess.userAgent }}
                                    </p>
                                    <p class="text-xs text-gray-400 mt-0.5">
                                        IP: {{ sess.ipAddress || 'Unknown' }}
                                    </p>
                                    <p class="text-xs text-gray-400">
                                        Active: {{ new Date(sess.createdAt).toLocaleDateString() }}
                                    </p>
                                </div>
                            </div>

                            <UButton v-if="!sess.isCurrent" color="neutral" variant="ghost" icon="heroicons:trash"
                                size="xs" :loading="revokingSessionId === sess.token"
                                @click="revokeSession(sess.token)" />
                        </div>
                    </div>
                </div>
            </template>
            <template #footer>
                <UButton color="neutral" variant="ghost" @click="showSessionsModal = false">{{ t('profile.modals.sessions.close') }}</UButton>
            </template>
        </UModal>

        <!-- Revoke All Sessions Confirmation Modal -->
        <UModal v-model:open="showRevokeAllModal" :title="t('profile.modals.sessions.revokeAllConfirm')"
            :description="t('profile.modals.sessions.revokeAllConfirmDesc')">
            <template #footer>
                <div class="flex justify-end gap-2 w-full">
                    <UButton color="neutral" variant="ghost" @click="showRevokeAllModal = false">{{ t('profile.cancel') }}</UButton>
                    <UButton color="error" @click="confirmRevokeAllSessions">{{ t('profile.modals.sessions.revokeAllConfirm') }}</UButton>
                </div>
            </template>
        </UModal>

        <!-- Delete Account Confirmation Modal -->
        <UModal v-model:open="showDeleteAccountModal" :title="t('profile.modals.deleteAccount.title')"
            :description="t('profile.modals.deleteAccount.description')">
            <template #body>
                <div class="space-y-4">
                    <div class="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p class="text-sm text-red-800 dark:text-red-200 font-medium">
                            ⚠️ {{ t('profile.modals.deleteAccount.danger') }}
                        </p>
                        <p class="text-xs text-red-600 dark:text-red-400 mt-2">
                            {{ t('profile.modals.deleteAccount.dangerDesc') }}
                        </p>
                    </div>
                    <UPassword
                        v-model="deleteAccountPassword"
                        :label="t('profile.modals.deleteAccount.confirmPassword')"
                        :placeholder="t('profile.modals.deleteAccount.enterPassword')"
                        :disabled="loadingDelete"
                        @keyup.enter="confirmDeleteAccount"
                        class="w-full"
                    />
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2 w-full">
                    <UButton color="neutral" variant="ghost" @click="showDeleteAccountModal = false">
                        {{ t('profile.cancel') }}
                    </UButton>
                    <UButton color="error" @click="confirmDeleteAccount" :loading="loadingDelete"
                        :disabled="!deleteAccountPassword">
                        {{ t('profile.modals.deleteAccount.delete') }}
                    </UButton>
                </div>
            </template>
        </UModal>
    </div>
</template>
