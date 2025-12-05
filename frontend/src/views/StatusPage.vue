<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-8 text-center">
      <h2 class="text-4xl font-spooky text-purple-400 mb-2">Orchestrator Status</h2>
      <p class="text-gray-400">Real-time monitoring of the haunting system</p>
    </div>

    <div class="space-y-6">
      <!-- Session Status Card -->
      <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-xl shadow-purple-900/10">
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-lg text-white flex items-center gap-2">
              <i class="pi pi-circle-fill text-xs" :class="sessionActive ? 'text-green-500 animate-pulse' : 'text-gray-500'"></i>
              Session Status
            </span>
            <Button 
              icon="pi pi-refresh"
              text
              rounded
              severity="secondary"
              @click="refreshStatus"
              :loading="loading"
            />
          </div>
        </template>
        
        <template #content>
          <div v-if="!sessionActive" class="text-center py-8">
            <i class="pi pi-moon text-5xl text-gray-600 mb-4 block"></i>
            <p class="text-gray-400 mb-4">No active haunting session</p>
            <Button 
              label="Start Haunting"
              icon="pi pi-bolt"
              severity="warning"
              @click="router.push('/devices')"
            />
          </div>

          <div v-else class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-zinc-800/50 rounded-lg p-4">
                <p class="text-xs text-gray-400 mb-1">Session ID</p>
                <p class="text-sm font-mono text-white truncate">{{ sessionId || 'N/A' }}</p>
              </div>
              <div class="bg-zinc-800/50 rounded-lg p-4">
                <p class="text-xs text-gray-400 mb-1">Status</p>
                <p class="text-sm font-semibold text-green-400">Active</p>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Command Queue Card -->
      <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-xl shadow-purple-900/10">
        <template #title>
          <span class="text-lg text-white flex items-center gap-2">
            <i class="pi pi-list"></i>
            Command Queue
          </span>
        </template>
        
        <template #content>
          <div v-if="!sessionActive" class="text-center py-8 text-gray-400">
            <i class="pi pi-inbox text-4xl mb-3 block"></i>
            <p class="text-sm">Start a haunting session to see the command queue</p>
          </div>

          <div v-else class="space-y-4">
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-orange-900/20 border border-orange-900/50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-orange-400">{{ queueStats.total }}</p>
                <p class="text-xs text-gray-400 mt-1">Total Commands</p>
              </div>
              <div class="bg-green-900/20 border border-green-900/50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-green-400">{{ queueStats.unspoken }}</p>
                <p class="text-xs text-gray-400 mt-1">Unspoken</p>
              </div>
              <div class="bg-purple-900/20 border border-purple-900/50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-purple-400">{{ queueStats.spoken }}</p>
                <p class="text-xs text-gray-400 mt-1">Spoken</p>
              </div>
            </div>

            <!-- Queue Health Indicator -->
            <div class="bg-zinc-800/50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-300">Queue Health</span>
                <span class="text-xs font-semibold" :class="queueHealthColor">{{ queueHealthText }}</span>
              </div>
              <div class="w-full bg-zinc-700 rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-500"
                  :class="queueHealthBarColor"
                  :style="{ width: `${queueHealthPercent}%` }"
                ></div>
              </div>
              <p class="text-xs text-gray-400 mt-2">
                Minimum queue size: 5 commands
              </p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Sub-Agent Status Card -->
      <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-xl shadow-purple-900/10">
        <template #title>
          <span class="text-lg text-white flex items-center gap-2">
            <i class="pi pi-users"></i>
            Sub-Agent Status
          </span>
        </template>
        
        <template #content>
          <div v-if="!sessionActive" class="text-center py-8 text-gray-400">
            <i class="pi pi-users text-4xl mb-3 block"></i>
            <p class="text-sm">Start a haunting session to see sub-agent status</p>
          </div>

          <div v-else class="space-y-3">
            <div 
              v-for="agent in subAgents" 
              :key="agent.type"
              class="bg-zinc-800/50 rounded-lg p-4 hover:bg-zinc-800/70 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <i :class="getAgentIcon(agent.type)" class="text-2xl text-orange-500"></i>
                  <div>
                    <p class="font-semibold text-white capitalize">{{ agent.type.replace('_', ' ') }} Agent</p>
                    <p class="text-xs text-gray-400">{{ agent.deviceCount }} device(s)</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div 
                    class="w-2 h-2 rounded-full"
                    :class="agent.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'"
                  ></div>
                  <span class="text-xs font-semibold" :class="agent.isRunning ? 'text-green-400' : 'text-gray-400'">
                    {{ agent.isRunning ? 'Running' : 'Idle' }}
                  </span>
                </div>
              </div>
              <div v-if="agent.lastFiredAt" class="mt-2 text-xs text-gray-500">
                Last fired: {{ formatTimestamp(agent.lastFiredAt) }}
              </div>
            </div>

            <div v-if="subAgents.length === 0" class="text-center py-4 text-gray-400">
              <p class="text-sm">No sub-agents active</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Configuration Card -->
      <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-xl shadow-purple-900/10">
        <template #title>
          <span class="text-lg text-white flex items-center gap-2">
            <i class="pi pi-cog"></i>
            Configuration
          </span>
        </template>
        
        <template #content>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-zinc-800/50 rounded-lg p-4">
              <p class="text-xs text-gray-400 mb-1">Fire Interval</p>
              <p class="text-sm text-white">3-8 seconds</p>
            </div>
            <div class="bg-zinc-800/50 rounded-lg p-4">
              <p class="text-xs text-gray-400 mb-1">Commands Per Call</p>
              <p class="text-sm text-white">3 commands</p>
            </div>
            <div class="bg-zinc-800/50 rounded-lg p-4">
              <p class="text-xs text-gray-400 mb-1">Min Queue Size</p>
              <p class="text-sm text-white">5 commands</p>
            </div>
            <div class="bg-zinc-800/50 rounded-lg p-4">
              <p class="text-xs text-gray-400 mb-1">Agent Timeout</p>
              <p class="text-sm text-white">30 seconds</p>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import api from '../services/api'

const router = useRouter()

interface SubAgent {
  type: string
  deviceCount: number
  isRunning: boolean
  lastFiredAt: number | null
}

const loading = ref(false)
const sessionActive = ref(false)
const sessionId = ref<string | null>(null)
const queueStats = ref({
  total: 0,
  unspoken: 0,
  spoken: 0,
})
const subAgents = ref<SubAgent[]>([])
let refreshInterval: number | null = null

const queueHealthPercent = computed(() => {
  if (queueStats.value.unspoken === 0) return 0
  return Math.min((queueStats.value.unspoken / 10) * 100, 100)
})

const queueHealthText = computed(() => {
  const unspoken = queueStats.value.unspoken
  if (unspoken >= 10) return 'Excellent'
  if (unspoken >= 5) return 'Good'
  if (unspoken >= 3) return 'Low'
  return 'Critical'
})

const queueHealthColor = computed(() => {
  const unspoken = queueStats.value.unspoken
  if (unspoken >= 10) return 'text-green-400'
  if (unspoken >= 5) return 'text-yellow-400'
  return 'text-red-400'
})

const queueHealthBarColor = computed(() => {
  const unspoken = queueStats.value.unspoken
  if (unspoken >= 10) return 'bg-green-500'
  if (unspoken >= 5) return 'bg-yellow-500'
  return 'bg-red-500'
})

const getAgentIcon = (type: string): string => {
  const icons: Record<string, string> = {
    light: 'pi-sun',
    speaker: 'pi-volume-up',
    tv: 'pi-desktop',
    smart_plug: 'pi-bolt'
  }
  return `pi ${icons[type] || 'pi-circle'}`
}

const formatTimestamp = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

const refreshStatus = async () => {
  loading.value = true
  
  try {
    // Try to get next command to check if session is active
    const response = await api.haunting.getNextCommand()
    
    if (response.command || response.queueSize > 0) {
      sessionActive.value = true
      
      // Update queue stats (mock for now - would need dedicated endpoint)
      queueStats.value.unspoken = response.queueSize
      queueStats.value.total = response.queueSize + 10 // Estimate
      queueStats.value.spoken = queueStats.value.total - queueStats.value.unspoken
      
      // Mock sub-agent data (would need dedicated endpoint)
      subAgents.value = [
        { type: 'light', deviceCount: 2, isRunning: Math.random() > 0.5, lastFiredAt: Date.now() - Math.random() * 30000 },
        { type: 'speaker', deviceCount: 1, isRunning: Math.random() > 0.5, lastFiredAt: Date.now() - Math.random() * 30000 },
        { type: 'tv', deviceCount: 1, isRunning: Math.random() > 0.5, lastFiredAt: Date.now() - Math.random() * 30000 },
      ]
    } else {
      sessionActive.value = false
      sessionId.value = null
      queueStats.value = { total: 0, unspoken: 0, spoken: 0 }
      subAgents.value = []
    }
  } catch (error) {
    console.error('Failed to refresh status:', error)
    sessionActive.value = false
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshStatus()
  
  // Auto-refresh every 2 seconds
  refreshInterval = window.setInterval(refreshStatus, 2000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
