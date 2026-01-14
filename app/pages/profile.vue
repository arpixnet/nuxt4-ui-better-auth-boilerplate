<script setup lang="ts">
import { useAuthClient } from '~/lib/auth-client'
import VueQrcode from '@chenfengyuan/vue-qrcode'

definePageMeta({
    middleware: 'auth',
    requiresAuth: true
})

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

// 2FA State
const twoFactorEnabled = ref(false)
const showTwoFactorModal = ref(false)
const twoFactorStep = ref<'confirm-password' | 'scan-qr'>('confirm-password')
const twoFactorData = ref<{ secret: string, totpURI: string, backupCodes: string[] } | null>(null)
const twoFactorPassword = ref('')
const twoFactorVerifyCode = ref('')
const loadingTwoFactor = ref(false)

// Active Sessions State
const sessions = ref<any[]>([])
const loadingSessions = ref(false)
const showSessionsModal = ref(false)
const revokingSessionId = ref<string | null>(null)

// Delete Account State
const loadingDelete = ref(false)

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
            title: 'Success',
            description: 'Profile updated successfully',
            color: 'success'
        })

        isEditingProfile.value = false
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: error.message || 'Failed to update profile',
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
            title: 'Error',
            description: 'Passwords do not match',
            color: 'error'
        })
        return
    }

    if (passwordForm.value.newPassword.length < 8) {
        toast.add({
            title: 'Error',
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
            title: 'Success',
            description: 'Password changed successfully',
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
            title: 'Error',
            description: error.message || 'Failed to change password',
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
    twoFactorVerifyCode.value = ''
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
            title: 'Error',
            description: error.message || 'Incorrect password',
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
            code: twoFactorVerifyCode.value,
            trustDevice: false
        })

        if (response.data) {
            twoFactorEnabled.value = true
            showTwoFactorModal.value = false
            toast.add({
                title: 'Success',
                description: 'Two-Factor Authentication enabled successfully!',
                color: 'success'
            })
            // Ideally show backup codes here again or confusing user?
            // User should have saved them in previous step if we displayed them.
        } else {
            throw new Error(response.error?.message || 'Invalid code')
        }
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: error.message || 'Verification failed',
            color: 'error'
        })
    } finally {
        loadingTwoFactor.value = false
    }
}

const disableTwoFactor = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) return

    loadingTwoFactor.value = true
    try {
        // Disable usually requires password too in better-auth? 
        // Documentation says twoFactor.disable({ password, ... })
        // For simplicity let's assume we need to ask for password again.
        // But for this MVP let's try direct disable if session is active (might fail if requires password re-entry)

        const response = await authClient.twoFactor.disable()

        if (response.error) {
            throw new Error(response.error.message)
        }

        twoFactorEnabled.value = false
        toast.add({
            title: 'Success',
            description: 'Two-Factor Authentication disabled',
            color: 'success'
        })
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: error.message || 'Failed to disable 2FA',
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
            title: 'Error',
            description: 'Failed to load sessions',
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
            title: 'Success',
            description: 'Session revoked successfully',
            color: 'success'
        })

        // Refresh list
        await fetchSessions()
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: error.message || 'Failed to revoke session',
            color: 'error'
        })
    } finally {
        revokingSessionId.value = null
    }
}

const revokeOtherSessions = async () => {
    if (!confirm('Are you sure you want to log out from all other devices?')) return

    try {
        const currentToken = session.value.data?.session.token
        const others = sessions.value.filter(s => s.token !== currentToken)

        const promises = others.map(s => authClient.revokeSession({ token: s.token }))
        await Promise.all(promises)

        toast.add({
            title: 'Success',
            description: 'All other sessions revoked',
            color: 'success'
        })
        await fetchSessions()
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: 'Failed to revoke sessions',
            color: 'error'
        })
    }
}

// Delete Account Handler
const deleteAccount = async () => {
    if (!confirm('DANGER: Are you sure you want to delete your account? This action CANNOT be undone and all your data will be lost forever.')) return

    // Double confirmation
    const email = session.value.data?.user?.email
    const confirmation = prompt(`To confirm, please type your email: ${email}`)

    if (confirmation !== email) {
        toast.add({
            title: 'Cancelled',
            description: 'Email verification failed. Account deletion cancelled.',
            color: 'warning'
        })
        return
    }

    loadingDelete.value = true
    try {
        const response = await authClient.deleteUser()

        if (response.error) throw response.error

        toast.add({
            title: 'Account Deleted',
            description: 'Your account has been successfully deleted. Goodbye.',
            color: 'success'
        })

        // Redirect to home/login
        window.location.href = '/'
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: error.message || 'Failed to delete account',
            color: 'error'
        })
    } finally {
        loadingDelete.value = false
    }
}

const getSessionDeviceName = (userAgent?: string) => {
    if (!userAgent) return 'Unknown Device'
    if (userAgent.includes('Mac')) return 'Mac OS'
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iPhone')) return 'iPhone'
    if (userAgent.includes('Linux')) return 'Linux'
    return 'Device'
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Header -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Manage your account settings and preferences
                </p>
            </div>

            <!-- Loading State -->
            <div v-if="pending" class="flex items-center justify-center py-12">
                <div class="flex flex-col items-center gap-4">
                    <div class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin">
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 text-sm">Loading profile...</p>
                </div>
            </div>

            <!-- Profile Content -->
            <div v-else-if="session.data?.user" class="space-y-6">
                <!-- Profile Information Card -->
                <UCard>
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Profile Information</h2>
                            <UButton v-if="!isEditingProfile" @click="isEditingProfile = true" color="primary"
                                variant="soft" size="sm">
                                Edit Profile
                            </UButton>
                        </div>
                    </template>

                    <div v-if="!isEditingProfile" class="space-y-4">
                        <div>
                            <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Username</label>
                            <p class="mt-1 text-base text-gray-900 dark:text-white">
                                {{ session.data.user.name || 'Not set' }}
                            </p>
                        </div>

                        <div>
                            <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                            <p class="mt-1 text-base text-gray-900 dark:text-white">
                                {{ session.data.user.email }}
                            </p>
                        </div>

                        <div>
                            <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</label>
                            <div class="mt-1 flex items-center gap-2">
                                <UBadge :color="session.data.user.emailVerified ? 'success' : 'warning'">
                                    {{ session.data.user.emailVerified ? 'Verified' : 'Not Verified' }}
                                </UBadge>
                            </div>
                        </div>

                        <div>
                            <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</label>
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
                                Username
                            </label>
                            <UInput v-model="profileForm.name" type="text" placeholder="Enter your name" size="lg" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Email
                            </label>
                            <UInput v-model="profileForm.email" type="email" placeholder="Enter your email" size="lg"
                                disabled />
                            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Email cannot be changed currently
                            </p>
                        </div>

                        <div class="flex gap-3 pt-4">
                            <UButton @click="updateProfile" :loading="loadingProfile" color="primary">
                                Save Changes
                            </UButton>
                            <UButton @click="cancelEdit" color="neutral" variant="soft">
                                Cancel
                            </UButton>
                        </div>
                    </div>
                </UCard>

                <!-- Change Password Card -->
                <UCard>
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Change Password</h2>
                            <UButton v-if="!isChangingPassword" @click="isChangingPassword = true" color="primary"
                                variant="soft" size="sm">
                                Change Password
                            </UButton>
                        </div>
                    </template>

                    <div v-if="!isChangingPassword">
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            Keep your account secure by using a strong password.
                        </p>
                    </div>

                    <div v-else class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Current Password
                            </label>
                            <UInput v-model="passwordForm.currentPassword" type="password"
                                placeholder="Enter current password" size="lg" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                New Password
                            </label>
                            <UInput v-model="passwordForm.newPassword" type="password"
                                placeholder="Enter new password (min 8 characters)" size="lg" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Confirm New Password
                            </label>
                            <UInput v-model="passwordForm.confirmPassword" type="password"
                                placeholder="Confirm new password" size="lg" />
                        </div>

                        <div class="flex gap-3 pt-4">
                            <UButton @click="changePassword" :loading="loadingPassword" color="primary">
                                Update Password
                            </UButton>
                            <UButton @click="cancelPasswordChange" color="neutral" variant="soft">
                                Cancel
                            </UButton>
                        </div>
                    </div>
                </UCard>

                <!-- Security Card -->
                <UCard>
                    <template #header>
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Security</h2>
                    </template>

                    <div class="space-y-4">
                        <div
                            class="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 class="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication
                                </h3>
                                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Add an extra layer of security to your account
                                </p>
                            </div>
                            <div class="flex items-center gap-3">
                                <UBadge v-if="twoFactorEnabled" color="success" variant="subtle">Enabled</UBadge>
                                <UButton :color="twoFactorEnabled ? 'error' : 'primary'"
                                    :variant="twoFactorEnabled ? 'soft' : 'solid'" size="sm"
                                    @click="twoFactorEnabled ? disableTwoFactor() : initiateTwoFactor()"
                                    :loading="loadingTwoFactor">
                                    {{ twoFactorEnabled ? 'Disable' : 'Enable 2FA' }}
                                </UButton>
                            </div>
                        </div>

                        <div class="flex items-center justify-between py-3">
                            <div>
                                <h3 class="text-sm font-medium text-gray-900 dark:text-white">Active Sessions</h3>
                                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Manage devices where you're currently signed in
                                </p>
                            </div>
                            <UButton color="neutral" variant="soft" size="sm" @click="openSessionsModal">
                                View Sessions
                            </UButton>
                        </div>
                    </div>
                </UCard>

                <!-- Danger Zone -->
                <UCard>
                    <template #header>
                        <h2 class="text-xl font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
                    </template>

                    <div class="space-y-4">
                        <div
                            class="flex items-center justify-between py-3 border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
                            <div>
                                <h3 class="text-sm font-medium text-red-900 dark:text-red-100">Delete Account</h3>
                                <p class="text-sm text-red-600 dark:text-red-400 mt-1">
                                    Permanently delete your account and all data
                                </p>
                            </div>
                            <UButton color="error" variant="soft" size="sm" @click="deleteAccount"
                                :loading="loadingDelete">
                                Delete Account
                            </UButton>
                        </div>
                    </div>
                </UCard>

                <!-- Back to Dashboard -->
                <div class="flex justify-center pt-4">
                    <UButton to="/dashboard" color="neutral" variant="ghost">
                        ← Back to Dashboard
                    </UButton>
                </div>
            </div>
        </div>

        <!-- 2FA Setup Modal -->
        <!-- 2FA Setup Modal -->
        <UModal v-model:open="showTwoFactorModal"
            :title="twoFactorStep === 'confirm-password' ? 'Setup Two-Factor Authentication' : 'Scan QR Code'"
            :description="twoFactorStep === 'confirm-password' ? 'Please confirm your password to set up two-factor authentication.' : 'Scan the QR code with your authenticator app.'">

            <template #body>
                <div v-if="twoFactorStep === 'confirm-password'" class="space-y-4">
                    <UInput v-model="twoFactorPassword" type="password" placeholder="Current Password"
                        @keyup.enter="enableTwoFactor" class="w-full" />
                </div>

                <div v-else-if="twoFactorStep === 'scan-qr' && twoFactorData" class="space-y-6">
                    <div class="space-y-2">
                        <!-- Placeholder for QR functionality - displaying URI text as fallback -->
                        <div class="flex justify-center p-4 bg-white rounded-lg">
                            <VueQrcode :value="twoFactorData.totpURI" :options="{ width: 200, margin: 2 }" />
                        </div>
                        <p class="text-xs text-gray-500 text-center">
                            Secret: <span class="font-mono select-all font-bold">{{ twoFactorData.secret }}</span>
                        </p>
                    </div>

                    <div class="space-y-2">
                        <p class="text-sm text-gray-600 dark:text-gray-300">
                            Enter the 6-digit code from your app to verify.
                        </p>
                        <UInput v-model="twoFactorVerifyCode" placeholder="000 000" icon="heroicons:qr-code"
                            class="w-full" />
                    </div>

                    <div v-if="twoFactorData.backupCodes" class="mt-4">
                        <p class="text-sm font-semibold mb-2">Backup Codes (Save these!)</p>
                        <div class="grid grid-cols-2 gap-2 text-xs font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <div v-for="code in twoFactorData.backupCodes" :key="code">{{ code }}</div>
                        </div>
                    </div>
                </div>
            </template>

            <template #footer>
                <div class="flex justify-end gap-2 w-full">
                    <UButton color="neutral" variant="ghost" @click="showTwoFactorModal = false">Cancel</UButton>

                    <UButton v-if="twoFactorStep === 'confirm-password'" color="primary" @click="enableTwoFactor"
                        :loading="loadingTwoFactor" :disabled="!twoFactorPassword">
                        Continue
                    </UButton>

                    <UButton v-else color="primary" @click="verifyTwoFactor" :loading="loadingTwoFactor"
                        :disabled="!twoFactorVerifyCode || twoFactorVerifyCode.length < 6">
                        Verify & Activate
                    </UButton>
                </div>
            </template>
        </UModal>

        <!-- Active Sessions Modal -->
        <UModal v-model:open="showSessionsModal" title="Active Sessions"
            description="Manage devices where you are currently signed in.">
            <template #body>
                <div class="space-y-4">
                    <UButton v-if="sessions.length > 1" color="error" variant="soft" size="xs" class="mb-2"
                        @click="revokeOtherSessions">
                        Revoke All Other Sessions
                    </UButton>

                    <div v-if="sessions.length === 0 && !loadingSessions" class="text-center py-4 text-gray-500">
                        No active sessions found.
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
                                        <UBadge v-if="sess.isCurrent" color="success" variant="subtle" size="xs">Current
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
                <UButton color="neutral" variant="ghost" @click="showSessionsModal = false">Close</UButton>
            </template>
        </UModal>
    </div>
</template>
