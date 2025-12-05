<template>
  <Dialog 
    v-model:visible="isVisible" 
    modal 
    :header="modalTitle"
    :style="{ width: '32rem' }"
    class="device-settings-modal"
    @hide="handleClose"
  >
    <div class="settings-form" v-if="localDevice">
      <!-- Device Name Section -->
      <div class="form-section">
        <label class="form-label">Device Name</label>
        <InputText 
          v-model="localDevice.name"
          placeholder="Enter device name"
          class="w-full"
          :class="{ 'p-invalid': errors.name }"
        />
        <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
      </div>

      <!-- Formal Name Section -->
      <div class="form-section">
        <label class="form-label">Formal Name</label>
        <InputText 
          v-model="localDevice.formalName"
          placeholder="Enter formal device name"
          class="w-full"
          :class="{ 'p-invalid': errors.formalName }"
        />
        <small class="form-help">This is the exact name used in voice commands</small>
        <small v-if="errors.formalName" class="p-error">{{ errors.formalName }}</small>
      </div>

      <!-- Frequency Section -->
      <div class="form-section">
        <label class="form-label">Frequency Setting</label>
        <div class="frequency-options">
          <div 
            v-for="option in frequencyOptions" 
            :key="option.value"
            class="frequency-option"
            :class="{ 'selected': localDevice.frequency === option.value }"
            @click="localDevice.frequency = option.value"
          >
            <RadioButton 
              v-model="localDevice.frequency" 
              :inputId="option.value" 
              :value="option.value" 
            />
            <label :for="option.value" class="frequency-label">
              <div class="frequency-title">{{ option.label }}</div>
              <div class="frequency-description">{{ option.description }}</div>
            </label>
          </div>
        </div>
      </div>

      <!-- Custom Prompt Section -->
      <div class="form-section">
        <div class="prompt-header">
          <label class="form-label">Custom Prompt</label>
          <Button 
            label="Reset to Default" 
            text 
            size="small"
            @click="resetToDefault"
            :disabled="loading"
          />
        </div>
        <Textarea 
          v-model="localDevice.customPrompt"
          :placeholder="defaultPromptPlaceholder"
          rows="4"
          class="w-full"
          :class="{ 'p-invalid': errors.customPrompt }"
        />
        <small class="form-help">
          Define how this device should behave during haunting. Leave empty to use default behavior.
        </small>
        <small v-if="errors.customPrompt" class="p-error">{{ errors.customPrompt }}</small>
      </div>

      <!-- Default Prompt Preview -->
      <div class="form-section" v-if="!localDevice.customPrompt">
        <label class="form-label">Default Behavior Preview</label>
        <div class="default-prompt-preview">
          {{ localDevice.defaultPrompt }}
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button 
          label="Cancel" 
          text 
          @click="handleClose"
          :disabled="loading"
        />
        <Button 
          label="Save Changes" 
          @click="handleSave"
          :loading="loading"
          :disabled="!isValid"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import RadioButton from 'primevue/radiobutton'
import Button from 'primevue/button'

interface Device {
  id: string
  name: string
  formalName: string
  type: string
  frequency: 'infrequent' | 'normal' | 'frequent'
  customPrompt?: string
  defaultPrompt: string
  enabled: boolean
}

interface DeviceUpdates {
  name?: string
  formalName?: string
  frequency?: 'infrequent' | 'normal' | 'frequent'
  customPrompt?: string
}

interface Props {
  device: Device | null
  isOpen: boolean
}

interface Emits {
  (e: 'save', updates: DeviceUpdates): void
  (e: 'close'): void
  (e: 'generate-default', deviceType: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localDevice = ref<Device | null>(null)
const loading = ref(false)
const errors = ref<Record<string, string>>({})

const isVisible = computed({
  get: () => props.isOpen,
  set: (value) => {
    if (!value) {
      emit('close')
    }
  }
})

const modalTitle = computed(() => {
  return localDevice.value ? `Settings - ${localDevice.value.name}` : 'Device Settings'
})

const frequencyOptions = [
  {
    value: 'infrequent' as const,
    label: 'Infrequent',
    description: 'Selected 50% less often (0.5x weight)'
  },
  {
    value: 'normal' as const,
    label: 'Normal',
    description: 'Standard selection frequency (1.0x weight)'
  },
  {
    value: 'frequent' as const,
    label: 'Frequent',
    description: 'Selected twice as often (2.0x weight)'
  }
]

const defaultPromptPlaceholder = computed(() => {
  return localDevice.value?.defaultPrompt || 'Enter custom behavior for this device...'
})

const isValid = computed(() => {
  return localDevice.value && 
         localDevice.value.name.trim() && 
         localDevice.value.formalName.trim() &&
         Object.keys(errors.value).length === 0
})

// Watch for device changes
watch(() => props.device, (newDevice) => {
  if (newDevice) {
    localDevice.value = { ...newDevice }
    errors.value = {}
  }
}, { immediate: true })

const validateForm = (): boolean => {
  errors.value = {}
  
  if (!localDevice.value) return false
  
  if (!localDevice.value.name.trim()) {
    errors.value.name = 'Device name is required'
  }
  
  if (!localDevice.value.formalName.trim()) {
    errors.value.formalName = 'Formal name is required'
  }
  
  if (localDevice.value.customPrompt && localDevice.value.customPrompt.trim().length < 10) {
    errors.value.customPrompt = 'Custom prompt must be at least 10 characters'
  }
  
  return Object.keys(errors.value).length === 0
}

const resetToDefault = () => {
  if (localDevice.value) {
    localDevice.value.customPrompt = ''
  }
}

const handleSave = async () => {
  if (!localDevice.value || !validateForm()) return
  
  loading.value = true
  
  try {
    const updates: DeviceUpdates = {}
    
    // Only include changed fields
    if (localDevice.value.name !== props.device?.name) {
      updates.name = localDevice.value.name
    }
    
    if (localDevice.value.formalName !== props.device?.formalName) {
      updates.formalName = localDevice.value.formalName
    }
    
    if (localDevice.value.frequency !== props.device?.frequency) {
      updates.frequency = localDevice.value.frequency
    }
    
    if (localDevice.value.customPrompt !== props.device?.customPrompt) {
      updates.customPrompt = localDevice.value.customPrompt || undefined
    }
    
    emit('save', updates)
  } catch (error) {
    console.error('Failed to save device settings:', error)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.device-settings-modal :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #1f2937, #374151);
  border-bottom: 1px solid #4b5563;
}

.device-settings-modal :deep(.p-dialog-content) {
  background: #111827;
  color: #f3f4f6;
}

.device-settings-modal :deep(.p-dialog-footer) {
  background: #111827;
  border-top: 1px solid #4b5563;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #f3f4f6;
  font-size: 0.875rem;
}

.form-help {
  color: #9ca3af;
  font-size: 0.75rem;
}

.frequency-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.frequency-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.frequency-option:hover {
  border-color: #4b5563;
  background: rgba(55, 65, 81, 0.3);
}

.frequency-option.selected {
  border-color: #f97316;
  background: rgba(249, 115, 22, 0.1);
}

.frequency-label {
  flex: 1;
  cursor: pointer;
}

.frequency-title {
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 0.25rem;
}

.frequency-description {
  font-size: 0.75rem;
  color: #9ca3af;
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.default-prompt-preview {
  padding: 0.75rem;
  background: rgba(55, 65, 81, 0.3);
  border: 1px solid #374151;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #d1d5db;
  font-style: italic;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Input styling */
.settings-form :deep(.p-inputtext),
.settings-form :deep(.p-inputtextarea) {
  background: #1f2937;
  border: 1px solid #374151;
  color: #f3f4f6;
}

.settings-form :deep(.p-inputtext:focus),
.settings-form :deep(.p-inputtextarea:focus) {
  border-color: #f97316;
  box-shadow: 0 0 0 1px #f97316;
}

.settings-form :deep(.p-inputtext.p-invalid),
.settings-form :deep(.p-inputtextarea.p-invalid) {
  border-color: #ef4444;
}

/* Radio button styling */
.settings-form :deep(.p-radiobutton .p-radiobutton-box) {
  background: #1f2937;
  border: 1px solid #374151;
}

.settings-form :deep(.p-radiobutton .p-radiobutton-box.p-highlight) {
  background: #f97316;
  border-color: #f97316;
}

.settings-form :deep(.p-radiobutton .p-radiobutton-box:not(.p-disabled):hover) {
  border-color: #f97316;
}
</style>