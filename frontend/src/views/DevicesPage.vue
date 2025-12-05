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
                class="p-3 bg-zinc-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <i :class="getDeviceIcon(device.type)" class="text-orange-500"></i>
                      <span class="font-semibold text-white">{{ device.name }}</span>
                    </div>
                    <p class="text-xs text-gray-400 capitalize">{{ device.type.replace('_', ' ') }}</p>
                  </div>
                  <Button 
                    icon="pi pi-trash"
                    text
                    rounded
                    severity="danger"
                    size="small"
                    @click="deleteDevice(device.id)"
                  />
                </div>
              </div>
            </div>

            <Button 
              v-if="devices.length > 0"
              label="Start Haunting"
              icon="pi pi-bolt"
              class="w-full mt-4"
              severity="warning"
              size="large"
              @click="router.push('/haunting')"
            />
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
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

const getDeviceIcon = (type: string): string => {
  const icons: Record<string, string> = {
    light: 'pi-sun',
    speaker: 'pi-volume-up',
    tv: 'pi-desktop',
    smart_plug: 'pi-bolt'
  }
  return `pi ${icons[type] || 'pi-circle'}`
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
</style>
