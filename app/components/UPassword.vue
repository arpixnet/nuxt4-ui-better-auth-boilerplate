<script setup lang="ts">
interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  color?: 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'
  error?: boolean | string
  errorMessage?: string | null
  showValidation?: boolean
  ariaLabel?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Password',
  placeholder: 'Enter Password',
  size: 'lg',
  disabled: false,
  color: undefined,
  error: false,
  errorMessage: null,
  showValidation: false,
  ariaLabel: undefined,
  class: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const show = ref(false)
const inputRef = ref<any>(null)

// Computed property for input type
const inputType = computed(() => (show.value ? 'text' : 'password'))

// Computed for aria-pressed (ensure boolean type)
const ariaPressed = computed(() => show.value)

// Computed for validation message
const validationMessage = computed(() => {
  if (props.errorMessage) return props.errorMessage
  if (props.showValidation && props.modelValue && props.modelValue.length < 8) {
    return 'Password must be at least 8 characters'
  }
  return null
})

// Computed for error state
const isError = computed(() => {
  if (props.error && typeof props.error === 'boolean') return true
  if (props.showValidation && props.modelValue && props.modelValue.length < 8) {
    return true
  }
  return false
})

// Computed for color
const inputColor = computed(() => {
  if (props.color) return props.color
  if (isError.value) return 'error'
  return undefined
})

// Focus method for external control
const focus = () => {
  inputRef.value?.focus?.()
}

// Expose focus method
defineExpose({
  focus,
})
</script>

<template>
  <div :class="class">
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {{ label }}
    </label>
    <UInput
      :ref="inputRef"
      :model-value="modelValue"
      :type="inputType"
      :placeholder="placeholder"
      :size="size"
      :disabled="disabled"
      :color="inputColor"
      :aria-label="ariaLabel || label"
      :aria-pressed="ariaPressed"
      @update:model-value="emit('update:modelValue', $event)"
      class="w-full"
      :ui="{ trailing: 'pe-1' }"
    >
      <template #leading>
        <Icon name="heroicons:lock-closed-20-solid" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
      </template>
      <template #trailing>
        <UButton
          color="neutral"
          variant="link"
          size="sm"
          :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          :aria-label="show ? 'Hide password' : 'Show password'"
          :aria-pressed="ariaPressed"
          @click="show = !show"
        />
      </template>
    </UInput>
    <p v-if="validationMessage" class="text-red-500 text-xs mt-1.5">
      {{ validationMessage }}
    </p>
    <p v-else-if="showValidation && !modelValue" class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
      Must be at least 8 characters
    </p>
  </div>
</template>
