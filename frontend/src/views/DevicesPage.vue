<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-8 text-center">
      <h2 class="text-4xl font-spooky text-purple-400 mb-2">Setup Your Devices</h2>
      <p class="text-gray-400">Chat with our AI to add your smart home devices</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Chat Interface -->
      <div class="lg:col-span-2">
        <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-xl shadow-purple-900/10 h-[600px] flex flex-col">
          <template #content>
            <div class="flex-1 overflow-y-auto mb-4 space-y-4 p-2" ref="chatContainer">
              <div 
                v-for="(message, index) in messages" 
                :key="index"
                :class="[
                  'flex gap-3 animate-fade-in',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                ]"
              >
                <div 
                  :class="[
                    'max-w-[80%] p-4 rounded-lg transition-all',
                    message.role === 'user' 
                      ? 'bg-orange-500/20 border border-orange-500/50' 
                      : 'bg-purple-900/20 border border-purple-900/50'
                  ]"
                >
                  <div class="flex items-start gap-2">
                    <i :class="[
                      'pi text-lg flex-shrink-0',
                      message.role === 'user' ? 'pi-user text-orange-400' : 'pi-sparkles text-purple-400'
                    ]"></i>
                    <p class="text-sm text-gray-200">{{ message.content }}</p>
                  </div>
                </div>
              </div>

              <div v-if="loading" class="flex justify-start animate-fade-in">
                <div class="bg-purple-900/20 border border-purple-900/50 p-4 rounded-lg">
                  <i class="pi pi-spin pi-spinner text-purple-400"></i>
                  <span class="ml-2 text-sm text-gray-300">AI is thinking...</span>
                </div>
              </div>
            </div>

            <div class="flex gap-2 p-2">
              <InputText 
                v-model="userMessage"
                placeholder="Describe your device (e.g., 'I have a bedroom lamp')"
                class="flex-1"
                @keyup.enter="sendMessage"
                :disabled="loading"
              />
              <Button 
                icon="pi pi-send"
                @click="sendMessage"
                :disabled="loading || !userMessage.trim()"
                severity="warning"
                :loading="loading"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Device List -->
      <div>
        <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-xl shadow-purple-900/10 sticky top-24">
          <template #title>
            <div class="flex items-center justify-between">
              <span class="text-lg text-white">Your Devices</span>
              <Tag :value="devices.length.toString()" severity="warning" />
            </div>
          </template>
          
          <template #content>
            <div v-if="devices.length === 0" class="text-center py-8 text-gray-400">
              <i class="pi pi-inbox text-4xl mb-3 block"></i>
              <p class="text-sm">No devices yet. Start chatting to add devices!</p>
            </div>

            <div v-else class="space-y-3 max-h-[400px] overflow-y-auto">
              <div 
                v-for="device in devices" 
                :key="device.id"
                class="device-card p-3 bg-zinc-800/50 rounded-lg border transition-all cursor-pointer"
                :class="[
                  device.enabled 
                    ? 'border-orange-500/50 bg-orange-500/5' 
                    : 'border-gray-700 hover:border-gray-600'
                ]"
                @click="openDeviceSettings(device)"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <i :class="[getDeviceIcon(device.type), device.enabled ? 'text-orange-500' : 'text-gray-500']"></i>
                      <span class="font-semibold" 
                            :class="device.enabled ? 'text-white' : 'text-gray-400'">
                        {{ device.name }}
                      </span>
                      <div class="flex items-center gap-1">
                        <DeviceToggle
                          :device-id="device.id"
                          :enabled="device.enabled"
                          :loading="toggleLoading[device.id]"
                          @toggle="handleDeviceToggle"
                          @click.stop
                        />
                      </div>
                    </div>
                    <div class="flex items-center gap-2 text-xs">
                      <span class="text-gray-400 capitalize">{{ device.type.replace('_', ' ') }}</span>
                      <span class="text-gray-600">•</span>
                      <span class="frequency-badge" :class="getFrequencyClass(device.frequency)">
                        {{ getFrequencyLabel(device.frequency) }}
                      </span>
                      <span v-if="device.customPrompt" class="custom-prompt-indicator">
                        <i class="pi pi-pencil text-xs"></i>
                        Custom
                      </span>
                    </div>
                  </div>
                  <Button 
                    icon="pi pi-trash"
                    text
                    rounded
                    severity="danger"
                    size="small"
                    @click.stop="deleteDevice(device.id)"
                  />
                </div>
                
                <!-- Status indicator -->
                <div v-if="!device.enabled" class="text-xs text-gray-500 italic">
                  Disabled - will not participate in haunting
                </div>
              </div>
            </div>

            <Button 
              v-if="enabledDevicesCount > 0"
              label="Start Haunting"
              icon="pi pi-bolt"
              class="w-full mt-4"
              severity="warning"
              size="large"
              @click="router.push('/haunting')"
            />
            
            <div v-else-if="devices.length > 0" class="text-center mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <i class="pi pi-exclamation-triangle text-yellow-500 mb-2 block"></i>
              <p class="text-xs text-yellow-200">Enable at least one device to start haunting</p>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Device Settings Modal -->
    <DeviceSettingsModal
      :device="selectedDevice"
      :is-open="showSettingsModal"
      @save="handleDeviceSettingsSave"
      @close="closeDeviceSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import DeviceToggle from '../components/DeviceToggle.vue'
import DeviceSettingsModal from '../components/DeviceSettingsModal.vue'
import api, { type Device, type ChatMessage } from '../services/api'

const router = useRouter()

const messages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    content: 'Hi! I\'m here to help you set up your devices. Tell me about a device you\'d like to add. For example: "I have a bedroom lamp" or "There\'s a living room speaker".'
  }
])

const devices = ref<Device[]>([])
const userMessage = ref('')
const loading = ref(false)
const chatContainer = ref<HTMLElement | null>(null)

// Enhanced device management state
const selectedDevice = ref<Device | null>(null)
const showSettingsModal = ref(false)
const toggleLoading = ref<Record<string, boolean>>({})

// Computed properties
const enabledDevicesCount = computed(() => 
  devices.value.filter(d => d.enabled).length
)

const getDeviceIcon = (type: string): string => {
  const icons: Record<string, string> = {
    light: 'pi-sun',
    speaker: 'pi-volume-up',
    tv: 'pi-desktop',
    smart_plug: 'pi-bolt'
  }
  return `pi ${icons[type] || 'pi-circle'}`
}

const getFrequencyLabel = (frequency: string): string => {
  const labels: Record<string, string> = {
    infrequent: 'Infrequent',
    normal: 'Normal',
    frequent: 'Frequent'
  }
  return labels[frequency] || 'Normal'
}

const getFrequencyClass = (frequency: string): string => {
  const classes: Record<string, string> = {
    infrequent: 'frequency-infrequent',
    normal: 'frequency-normal',
    frequent: 'frequency-frequent'
  }
  return classes[frequency] || 'frequency-normal'
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  if (!userMessage.value.trim() || loading.value) return
  
  const message = userMessage.value
  userMessage.value = ''
  
  messages.value.push({
    role: 'user',
    content: message
  })
  
  scrollToBottom()
  loading.value = true
  
  try {
    // Get conversation history (exclude first system message and the message we just added)
    const conversationHistory = messages.value.slice(1, -1)
    
    console.log('Sending message:', message)
    console.log('Conversation history:', conversationHistory)
    
    // Call API
    const response = await api.devices.chat(message, conversationHistory)
    
    console.log('API response:', response)
    
    messages.value.push({
      role: 'assistant',
      content: response.response
    })
    
    // If a device was saved, add it to the list
    if (response.deviceSaved && response.device) {
      devices.value.push(response.device)
    }
    
    scrollToBottom()
  } catch (error: any) {
    console.error('Failed to send message:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response
    })
    messages.value.push({
      role: 'assistant',
      content: `Sorry, I encountered an error: ${error.message}. Please try again.`
    })
    scrollToBottom()
  } finally {
    loading.value = false
  }
}

const handleDeviceToggle = async (deviceId: string, enabled: boolean) => {
  toggleLoading.value[deviceId] = true
  
  try {
    await api.devices.toggleDevice(deviceId, enabled)
    
    // Update local device state
    const device = devices.value.find(d => d.id === deviceId)
    if (device) {
      device.enabled = enabled
    }
  } catch (error: any) {
    console.error('Failed to toggle device:', error)
    alert(`Failed to toggle device: ${error.message}`)
  } finally {
    toggleLoading.value[deviceId] = false
  }
}

const openDeviceSettings = (device: Device) => {
  selectedDevice.value = device
  showSettingsModal.value = true
}

const closeDeviceSettings = () => {
  showSettingsModal.value = false
  selectedDevice.value = null
}

const handleDeviceSettingsSave = async (updates: any) => {
  if (!selectedDevice.value) return
  
  try {
    const updatedDevice = await api.devices.updateDeviceSettings(selectedDevice.value.id, updates)
    
    // Update local device state
    const deviceIndex = devices.value.findIndex(d => d.id === selectedDevice.value!.id)
    if (deviceIndex !== -1) {
      devices.value[deviceIndex] = updatedDevice
    }
    
    closeDeviceSettings()
  } catch (error: any) {
    console.error('Failed to update device settings:', error)
    alert(`Failed to update device settings: ${error.message}`)
  }
}

const deleteDevice = async (id: string) => {
  try {
    await api.devices.deleteDevice(id)
    devices.value = devices.value.filter(d => d.id !== id)
  } catch (error: any) {
    console.error('Failed to delete device:', error)
    alert(`Failed to delete device: ${error.message}`)
  }
}

const loadDevices = async () => {
  try {
    devices.value = await api.devices.getDevices()
  } catch (error) {
    console.error('Failed to load devices:', error)
  }
}

onMounted(() => {
  scrollToBottom()
  loadDevices()
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

/* Enhanced device card styling */
.device-card {
  transition: all 0.2s ease;
}

.device-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.frequency-badge {
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-weight: 500;
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.frequency-infrequent {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.frequency-normal {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.frequency-frequent {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.custom-prompt-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  background: rgba(168, 85, 247, 0.2);
  color: #c4b5fd;
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 500;
}
</style>
