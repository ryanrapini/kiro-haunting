<template>
  <div class="max-w-3xl mx-auto">
    <Card class="bg-zinc-900/50 border border-purple-900/50">
      <template #title>
        <div class="text-center">
          <i class="pi pi-moon text-6xl text-purple-500 mb-4 animate-float"></i>
          <h2 class="text-4xl font-spooky text-purple-400">Haunting Active</h2>
          <p class="text-gray-400 text-base font-normal mt-2">
            Listen and repeat the commands to your voice assistant
          </p>
        </div>
      </template>
      
      <template #content>
        <div class="space-y-6">
          <!-- Status Indicator -->
          <div class="bg-green-900/20 border border-green-900/50 rounded-lg p-6 text-center">
            <div class="flex items-center justify-center gap-3 mb-2">
              <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-xl font-semibold text-green-400">Haunting in Progress</span>
            </div>
            <p class="text-sm text-gray-400">
              Commands will be spoken every 2-5 seconds
            </p>
          </div>

          <!-- Current Command Display -->
          <div class="bg-zinc-800/50 border border-orange-500/50 rounded-lg p-8">
            <div class="text-center">
              <i class="pi pi-microphone text-4xl text-orange-500 mb-4"></i>
              <p class="text-sm text-gray-400 mb-2">Last Command:</p>
              <p class="text-2xl font-semibold text-orange-400">
                {{ currentCommand || 'Waiting for next command...' }}
              </p>
            </div>
          </div>

          <!-- Command History -->
          <div>
            <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
              <i class="pi pi-history"></i>
              Command History
            </h3>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div 
                v-for="(cmd, index) in commandHistory" 
                :key="index"
                class="p-3 bg-zinc-800/30 rounded border border-gray-700 text-sm"
              >
                <div class="flex items-center justify-between">
                  <span class="text-gray-300">{{ cmd.text }}</span>
                  <span class="text-xs text-gray-500">{{ cmd.time }}</span>
                </div>
              </div>
              
              <div v-if="commandHistory.length === 0" class="text-center py-8 text-gray-400">
                <i class="pi pi-inbox text-3xl mb-2"></i>
                <p class="text-sm">No commands spoken yet</p>
              </div>
            </div>
          </div>

          <!-- Controls -->
          <div class="flex gap-3">
            <Button 
              label="Stop Haunting"
              icon="pi pi-stop"
              severity="danger"
              class="flex-1"
              size="large"
              @click="stopHaunting"
            />
            <Button 
              :label="isMuted ? 'Unmute' : 'Mute'"
              :icon="isMuted ? 'pi-volume-off' : 'pi-volume-up'"
              outlined
              @click="toggleMute"
            />
          </div>

          <!-- Info -->
          <div class="bg-purple-900/20 border border-purple-900/50 rounded-lg p-4">
            <div class="flex gap-3">
              <i class="pi pi-info-circle text-purple-400 text-xl"></i>
              <div class="text-sm text-gray-400">
                <p class="mb-2">
                  <strong class="text-white">How it works:</strong>
                </p>
                <ul class="list-disc list-inside space-y-1">
                  <li>The browser will speak commands using text-to-speech</li>
                  <li>Listen to each command and repeat it to your voice assistant</li>
                  <li>Your devices will respond to the commands</li>
                  <li>Commands are randomized for variety</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'

const router = useRouter()

interface CommandHistoryItem {
  text: string
  time: string
}

const currentCommand = ref('')
const commandHistory = ref<CommandHistoryItem[]>([])
const isMuted = ref(false)
let pollInterval: number | null = null
let speechSynthesis: SpeechSynthesis | null = null

const speakCommand = (text: string) => {
  if (isMuted.value || !window.speechSynthesis) return
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9
  utterance.pitch = 0.8
  utterance.volume = 1.0
  
  window.speechSynthesis.speak(utterance)
}

const getNextCommand = async () => {
  try {
    // TODO: Call API endpoint
    // Simulate command for now
    const commands = [
      'Alexa, turn bedroom lamp to red',
      'Alexa, dim living room lights to 20 percent',
      'Alexa, play spooky sounds on kitchen speaker',
      'Alexa, turn off bedroom fan',
      'Alexa, set living room lamp to purple'
    ]
    
    const command = commands[Math.floor(Math.random() * commands.length)]
    currentCommand.value = command
    
    commandHistory.value.unshift({
      text: command,
      time: new Date().toLocaleTimeString()
    })
    
    // Keep only last 10 commands
    if (commandHistory.value.length > 10) {
      commandHistory.value = commandHistory.value.slice(0, 10)
    }
    
    speakCommand(command)
  } catch (error) {
    console.error('Failed to get next command:', error)
  }
}

const startPolling = () => {
  const poll = () => {
    getNextCommand()
    
    // Random delay between 2-5 seconds
    const delay = Math.random() * 3000 + 2000
    pollInterval = window.setTimeout(poll, delay)
  }
  
  poll()
}

const stopPolling = () => {
  if (pollInterval) {
    clearTimeout(pollInterval)
    pollInterval = null
  }
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  
  if (isMuted.value && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

const stopHaunting = async () => {
  stopPolling()
  
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  
  try {
    // TODO: Call API to stop haunting
    router.push('/devices')
  } catch (error) {
    console.error('Failed to stop haunting:', error)
  }
}

onMounted(() => {
  speechSynthesis = window.speechSynthesis
  startPolling()
})

onUnmounted(() => {
  stopPolling()
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
})
</script>
