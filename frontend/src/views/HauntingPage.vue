<template>
  <div class="max-w-3xl mx-auto">
    <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-2xl shadow-purple-900/20">
      <template #title>
        <div class="text-center pt-4">
          <i class="pi pi-moon text-6xl text-purple-500 mb-4 animate-float block"></i>
          <h2 class="text-4xl font-spooky text-purple-400">Haunting Active</h2>
          <p class="text-gray-400 text-base font-normal mt-2">
            Listen and repeat the commands to your voice assistant
          </p>
        </div>
      </template>
      
      <template #content>
        <div class="space-y-6 p-2">
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
          <div class="bg-zinc-800/50 border-2 border-orange-500/50 rounded-lg p-8 transition-all hover:border-orange-500/70">
            <div class="text-center">
              <i class="pi pi-microphone text-4xl text-orange-500 mb-4 block animate-pulse"></i>
              <p class="text-sm text-gray-400 mb-2">Last Command:</p>
              <p class="text-2xl font-semibold text-orange-400 min-h-[2rem]">
                {{ currentCommand || 'Waiting for next command...' }}
              </p>
            </div>
          </div>

          <!-- Command History -->
          <div>
            <h3 class="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
              <i class="pi pi-history"></i>
              Command History
            </h3>
            <div class="space-y-2 max-h-64 overflow-y-auto bg-zinc-800/30 rounded-lg p-3">
              <div 
                v-for="(cmd, index) in commandHistory" 
                :key="index"
                class="p-3 bg-zinc-800/50 rounded border border-gray-700 text-sm hover:border-gray-600 transition-colors"
              >
                <div class="flex items-center justify-between gap-3">
                  <span class="text-gray-300 flex-1">{{ cmd.text }}</span>
                  <span class="text-xs text-gray-500 flex-shrink-0">{{ cmd.time }}</span>
                </div>
              </div>
              
              <div v-if="commandHistory.length === 0" class="text-center py-8 text-gray-400">
                <i class="pi pi-inbox text-3xl mb-2 block"></i>
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
              severity="secondary"
              @click="toggleMute"
            />
          </div>

          <!-- Info -->
          <div class="bg-purple-900/20 border border-purple-900/50 rounded-lg p-4">
            <div class="flex gap-3">
              <i class="pi pi-info-circle text-purple-400 text-xl flex-shrink-0"></i>
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
import api from '../services/api'

const router = useRouter()

interface CommandHistoryItem {
  text: string
  time: string
}

const currentCommand = ref('')
const commandHistory = ref<CommandHistoryItem[]>([])
const isMuted = ref(false)
const sessionActive = ref(false)
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
    const response = await api.haunting.getNextCommand()
    
    if (response.command) {
      const commandText = response.command.commandText
      currentCommand.value = commandText
      
      commandHistory.value.unshift({
        text: commandText,
        time: new Date().toLocaleTimeString()
      })
      
      // Keep only last 10 commands
      if (commandHistory.value.length > 10) {
        commandHistory.value = commandHistory.value.slice(0, 10)
      }
      
      speakCommand(commandText)
    } else {
      // No commands available
      console.log('No commands available:', response.message)
    }
  } catch (error: any) {
    console.error('Failed to get next command:', error)
    
    // If session not found, stop polling
    if (error.message?.includes('No active haunting session')) {
      stopPolling()
      sessionActive.value = false
    }
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
    await api.haunting.stop()
    sessionActive.value = false
    router.push('/devices')
  } catch (error: any) {
    console.error('Failed to stop haunting:', error)
    alert(`Failed to stop haunting: ${error.message}`)
  }
}

const startHauntingSession = async () => {
  try {
    await api.haunting.start()
    sessionActive.value = true
    startPolling()
  } catch (error: any) {
    console.error('Failed to start haunting:', error)
    alert(`Failed to start haunting: ${error.message}`)
    router.push('/devices')
  }
}

onMounted(() => {
  speechSynthesis = window.speechSynthesis
  startHauntingSession()
})

onUnmounted(() => {
  stopPolling()
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
})
</script>
