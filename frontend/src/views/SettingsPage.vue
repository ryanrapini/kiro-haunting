<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-8 text-center">
      <h2 class="text-4xl font-spooky text-purple-400 mb-2">Orchestrator Settings</h2>
      <p class="text-gray-400">Configure timing and safety settings for your haunting experience</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Settings Form -->
      <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-xl shadow-purple-900/10">
        <template #title>
          <div class="flex items-center gap-3 text-xl text-white">
            <i class="pi pi-cog text-orange-500"></i>
            Timing Configuration
          </div>
        </template>
        
        <template #content>
          <div class="space-y-6">
            <!-- Minimum Trigger Interval -->
            <div>
              <label class="block text-sm font-medium mb-2 text-gray-200">
                Minimum Trigger Interval (seconds)
              </label>
              <InputNumber 
                v-model="formSettings.minTriggerInterval"
                :min="1"
                :max="300"
                :step="1"
                :invalid="!!validationErrors.minTriggerInterval"
                class="w-full"
                placeholder="5"
              />
              <small v-if="validationErrors.minTriggerInterval" class="text-red-400">
                {{ validationErrors.minTriggerInterval }}
              </small>
              <small class="text-gray-400 block mt-1">
                Minimum time between random device actions (1-300 seconds)
              </small>
            </div>

            <!-- Maximum Trigger Interval -->
            <div>
              <label class="block text-sm font-medium mb-2 text-gray-200">
                Maximum Trigger Interval (seconds)
              </label>
              <InputNumber 
                v-model="formSettings.maxTriggerInterval"
                :min="1"
                :max="600"
                :step="1"
                :invalid="!!validationErrors.maxTriggerInterval"
                class="w-full"
                placeholder="30"
              />
              <small v-if="validationErrors.maxTriggerInterval" class="text-red-400">
                {{ validationErrors.maxTriggerInterval }}
              </small>
              <small class="text-gray-400 block mt-1">
                Maximum time between random device actions (1-600 seconds)
              </small>
            </div>

            <!-- Epilepsy Mode -->
            <div>
              <div class="flex items-center gap-3 mb-2">
                <ToggleButton 
                  v-model="formSettings.epilepsyMode"
                  onLabel="Enabled"
                  offLabel="Disabled"
                  onIcon="pi pi-check"
                  offIcon="pi pi-times"
                  :disabled="true"
                  :class="'p-button-secondary opacity-50'"
                />
                <label class="text-sm font-medium text-gray-200">
                  Epilepsy Safety Mode
                </label>
                <span class="text-xs bg-orange-900/30 text-orange-300 px-2 py-1 rounded-full border border-orange-700/50">
                  Coming Soon
                </span>
              </div>
              
              <small class="text-gray-400 block mt-2">
                Prevents rapid flashing and visual effects that could trigger photosensitive epilepsy
              </small>
            </div>
          </div>
        </template>
      </Card>

      <!-- Current Settings Display -->
      <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-xl shadow-purple-900/10">
        <template #title>
          <div class="flex items-center gap-3 text-xl text-white">
            <i class="pi pi-info-circle text-purple-400"></i>
            Current Configuration
          </div>
        </template>
        
        <template #content>
          <div class="space-y-4">
            <div v-if="currentSettings">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="bg-zinc-800/50 p-3 rounded-lg">
                  <div class="text-gray-400 mb-1">Min Interval</div>
                  <div class="text-white font-semibold">{{ currentSettings.minTriggerInterval }}s</div>
                </div>
                <div class="bg-zinc-800/50 p-3 rounded-lg">
                  <div class="text-gray-400 mb-1">Max Interval</div>
                  <div class="text-white font-semibold">{{ currentSettings.maxTriggerInterval }}s</div>
                </div>
              </div>
              
              <div class="bg-zinc-800/50 p-3 rounded-lg">
                <div class="text-gray-400 mb-1">Epilepsy Mode</div>
                <div class="flex items-center gap-2">
                  <i class="pi pi-times text-gray-500 text-sm"></i>
                  <span class="text-gray-400 font-semibold">Coming Soon</span>
                </div>
              </div>

              <div class="text-xs text-gray-500 mt-4">
                Last updated: {{ formatDate(currentSettings.updatedAt) }}
              </div>
            </div>
            
            <div v-else-if="loading" class="text-center py-8">
              <i class="pi pi-spin pi-spinner text-purple-400 text-2xl"></i>
              <p class="text-gray-400 mt-2">Loading settings...</p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Action Buttons -->
    <div class="mt-8 flex gap-4 justify-center">
      <Button 
        label="Reset to Defaults"
        icon="pi pi-refresh"
        severity="secondary"
        outlined
        :disabled="loading || saving"
        @click="resetToDefaults"
      />
      <Button 
        label="Save Settings"
        icon="pi pi-save"
        severity="warning"
        :loading="saving"
        :disabled="!isFormValid || loading"
        @click="saveSettings"
      />
    </div>

    <!-- Navigation -->
    <div class="mt-8 flex gap-4 justify-center">
      <Button 
        label="Back to Devices"
        icon="pi pi-arrow-left"
        severity="secondary"
        outlined
        @click="router.push('/devices')"
      />
      <Button 
        label="Start Haunting"
        icon="pi pi-play"
        severity="success"
        @click="router.push('/haunting')"
      />
    </div>

    <!-- Success/Error Messages -->
    <Message v-if="successMessage" severity="success" :closable="true" @close="successMessage = ''">
      {{ successMessage }}
    </Message>
    
    <Message v-if="errorMessage" severity="error" :closable="true" @close="errorMessage = ''">
      {{ errorMessage }}
    </Message>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import ToggleButton from 'primevue/togglebutton'
import Message from 'primevue/message'
import api, { type OrchestratorSettings, type SettingsUpdateRequest } from '../services/api'

const router = useRouter()

// Local interfaces
interface ValidationErrors {
  minTriggerInterval?: string
  maxTriggerInterval?: string
}

// Reactive state
const currentSettings = ref<OrchestratorSettings | null>(null)
const formSettings = ref({
  minTriggerInterval: 5,
  maxTriggerInterval: 30,
  epilepsyMode: false
})

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const validationErrors = ref<ValidationErrors>({})

// Computed properties
const isFormValid = computed(() => {
  return Object.keys(validationErrors.value).length === 0 && 
         formSettings.value.minTriggerInterval > 0 &&
         formSettings.value.maxTriggerInterval > 0 &&
         formSettings.value.minTriggerInterval <= formSettings.value.maxTriggerInterval
})

// Validation
const validateSettings = () => {
  const errors: ValidationErrors = {}
  
  if (formSettings.value.minTriggerInterval < 1) {
    errors.minTriggerInterval = 'Minimum interval must be at least 1 second'
  } else if (formSettings.value.minTriggerInterval > 300) {
    errors.minTriggerInterval = 'Minimum interval cannot exceed 300 seconds'
  }
  
  if (formSettings.value.maxTriggerInterval < 1) {
    errors.maxTriggerInterval = 'Maximum interval must be at least 1 second'
  } else if (formSettings.value.maxTriggerInterval > 600) {
    errors.maxTriggerInterval = 'Maximum interval cannot exceed 600 seconds'
  }
  
  if (formSettings.value.minTriggerInterval > formSettings.value.maxTriggerInterval) {
    errors.minTriggerInterval = 'Minimum interval must be less than or equal to maximum interval'
    errors.maxTriggerInterval = 'Maximum interval must be greater than or equal to minimum interval'
  }
  
  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

// Watch for form changes to validate
import { watch } from 'vue'
watch(formSettings, validateSettings, { deep: true })

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const resetToDefaults = () => {
  formSettings.value = {
    minTriggerInterval: 5,
    maxTriggerInterval: 30,
    epilepsyMode: false
  }
  validationErrors.value = {}
}

// API functions
const loadSettings = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    const settings = await api.settings.getSettings()
    
    currentSettings.value = settings
    formSettings.value = {
      minTriggerInterval: settings.minTriggerInterval,
      maxTriggerInterval: settings.maxTriggerInterval,
      epilepsyMode: settings.epilepsyMode
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to load settings'
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  if (!validateSettings()) {
    return
  }
  
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const updateRequest: SettingsUpdateRequest = {
      minTriggerInterval: formSettings.value.minTriggerInterval,
      maxTriggerInterval: formSettings.value.maxTriggerInterval,
      epilepsyMode: false // Always false since it's coming soon
    }
    
    const updatedSettings = await api.settings.updateSettings(updateRequest)
    
    currentSettings.value = updatedSettings
    successMessage.value = 'Settings saved successfully!'
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to save settings'
  } finally {
    saving.value = false
  }
}

// Load settings on component mount
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>