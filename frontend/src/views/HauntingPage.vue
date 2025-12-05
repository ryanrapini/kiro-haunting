<template>
  <div class="haunting-page">
    <!-- Header Section -->
    <div class="haunting-header">
      <div class="header-content">
        <i class="pi pi-moon text-6xl text-purple-500 mb-4 animate-float block"></i>
        <h2 class="text-4xl font-spooky text-purple-400">Haunting Monitor</h2>
        <p class="text-gray-400 text-base font-normal mt-2">
          Watch your devices come alive with spooky actions
        </p>
      </div>
    </div>

    <!-- Phase Indicator -->
    <div class="phase-indicator">
      <div class="phase-content" :class="phaseClass">
        <div class="phase-icon">
          <i :class="phaseIcon" class="text-2xl"></i>
        </div>
        <div class="phase-info">
          <h3 class="phase-title">{{ phaseTitle }}</h3>
          <p class="phase-description">{{ phaseDescription }}</p>
        </div>
        <div v-if="setupProgress && currentPhase === 'setup'" class="progress-info">
          <div class="progress-text">
            {{ setupProgress.completedDevices }} / {{ setupProgress.totalDevices }} devices configured
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${(setupProgress.completedDevices / setupProgress.totalDevices) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Device Tiles Grid -->
    <div class="device-grid-container">
      <div v-if="devices.length === 0" class="no-devices">
        <i class="pi pi-inbox text-4xl text-gray-400 mb-4"></i>
        <p class="text-gray-400">No devices configured for haunting</p>
        <Button 
          label="Configure Devices" 
          icon="pi pi-cog"
          @click="$router.push('/devices')"
          class="mt-4"
        />
      </div>
      
      <div v-else class="device-grid">
        <DeviceTile
          v-for="device in enabledDevices"
          :key="device.id"
          :ref="(el) => registerDeviceTile(device.id, el)"
          :device="device"
          :is-active="activeDevices.has(device.id)"
          :last-action="getLastDeviceAction(device.id)"
          :epilepsy-mode="epilepsyMode"
          @device-click="handleDeviceClick"
        />
      </div>
    </div>

    <!-- Ghost Animations -->
    <GhostAnimation
      v-for="ghost in activeGhosts"
      :key="ghost.id"
      :device-id="ghost.deviceId"
      :action="ghost.action"
      :position="ghost.position"
      :epilepsy-mode="epilepsyMode"
      @complete="handleGhostComplete(ghost.id)"
    />

    <!-- Controls -->
    <div class="controls-section">
      <div class="controls-grid">
        <Button 
          label="Stop Haunting"
          icon="pi pi-stop"
          severity="danger"
          size="large"
          @click="stopHaunting"
          class="stop-button"
        />
        <Button 
          :label="isMuted ? 'Unmute' : 'Mute'"
          :icon="isMuted ? 'pi-volume-off' : 'pi-volume-up'"
          outlined
          severity="secondary"
          @click="toggleMute"
          class="mute-button"
        />
      </div>
    </div>

    <!-- Command History (Collapsible) -->
    <div class="command-history-section">
      <div class="history-header" @click="showHistory = !showHistory">
        <h3 class="history-title">
          <i class="pi pi-history"></i>
          Command History
        </h3>
        <i :class="showHistory ? 'pi-chevron-up' : 'pi-chevron-down'" class="pi"></i>
      </div>
      
      <div v-if="showHistory" class="history-content">
        <div class="command-list">
          <div 
            v-for="(cmd, index) in commandHistory" 
            :key="index"
            class="command-item"
          >
            <div class="command-text">{{ cmd.text }}</div>
            <div class="command-time">{{ cmd.time }}</div>
          </div>
          
          <div v-if="commandHistory.length === 0" class="no-commands">
            <i class="pi pi-inbox text-2xl mb-2 block text-gray-400"></i>
            <p class="text-sm text-gray-400">No commands spoken yet</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import DeviceTile from '../components/DeviceTile.vue'
import GhostAnimation from '../components/GhostAnimation.vue'
import { ghostManager, type GhostInstance } from '../services/ghostManager'
import api, { type Device, type OrchestratorSettings } from '../services/api'

const router = useRouter()

interface CommandHistoryItem {
  text: string
  time: string
  deviceName?: string
}

interface DeviceActionEvent {
  deviceId: string
  deviceName: string
  action: string
  timestamp: Date
  phase: 'setup' | 'random'
}

interface SetupProgress {
  totalDevices: number
  completedDevices: number
  currentDevice?: string
  isComplete: boolean
}

// State
const devices = ref<Device[]>([])
const commandHistory = ref<CommandHistoryItem[]>([])
const isMuted = ref(false)
const sessionActive = ref(false)
const showHistory = ref(false)
const currentPhase = ref<'idle' | 'setup' | 'active'>('idle')
const setupProgress = ref<SetupProgress | null>(null)
const activeDevices = ref(new Set<string>())
const deviceActions = ref(new Map<string, DeviceActionEvent>())
const activeGhosts = ref<GhostInstance[]>([])
const epilepsyMode = ref(false)

// Polling
let pollInterval: number | null = null
let speechSynthesis: SpeechSynthesis | null = null

// Computed
const enabledDevices = computed(() => devices.value.filter(d => d.enabled))

const phaseClass = computed(() => ({
  'phase-setup': currentPhase.value === 'setup',
  'phase-active': currentPhase.value === 'active',
  'phase-idle': currentPhase.value === 'idle'
}))

const phaseIcon = computed(() => {
  switch (currentPhase.value) {
    case 'setup': return 'pi pi-cog pi-spin'
    case 'active': return 'pi pi-bolt'
    default: return 'pi pi-moon'
  }
})

const phaseTitle = computed(() => {
  switch (currentPhase.value) {
    case 'setup': return 'Setting the Scene'
    case 'active': return 'Haunting Active'
    default: return 'Preparing...'
  }
})

const phaseDescription = computed(() => {
  switch (currentPhase.value) {
    case 'setup': return 'Configuring all devices for the perfect spooky atmosphere'
    case 'active': return 'Random spooky actions are happening across your devices'
    default: return 'Getting ready to haunt your home'
  }
})

// Methods
const loadDevices = async () => {
  try {
    devices.value = await api.devices.getDevices()
  } catch (error: any) {
    console.error('Failed to load devices:', error)
  }
}

const loadSettings = async () => {
  try {
    const settings = await api.settings.getSettings()
    epilepsyMode.value = settings.epilepsyMode
  } catch (error: any) {
    console.error('Failed to load settings:', error)
  }
}

const registerDeviceTile = (deviceId: string, tileComponent: any) => {
  if (tileComponent && tileComponent.$el) {
    nextTick(() => {
      ghostManager.registerDeviceTile(deviceId, tileComponent.$el)
    })
  }
}

const handleDeviceClick = (deviceId: string) => {
  // Could open device settings or show device details
  console.log('Device clicked:', deviceId)
}

const getLastDeviceAction = (deviceId: string): DeviceActionEvent | undefined => {
  return deviceActions.value.get(deviceId)
}

const handleGhostComplete = (ghostId: string) => {
  ghostManager.removeGhost(ghostId)
  updateActiveGhosts()
}

const updateActiveGhosts = () => {
  activeGhosts.value = ghostManager.getActiveGhosts()
}

const speakCommand = (text: string) => {
  if (isMuted.value || !window.speechSynthesis) return
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9
  utterance.pitch = 0.8
  utterance.volume = 1.0
  
  window.speechSynthesis.speak(utterance)
}

const processCommand = (command: any) => {
  const commandText = command.commandText
  const deviceName = command.deviceName
  
  // Add to history
  commandHistory.value.unshift({
    text: commandText,
    time: new Date().toLocaleTimeString(),
    deviceName
  })
  
  // Keep only last 20 commands
  if (commandHistory.value.length > 20) {
    commandHistory.value = commandHistory.value.slice(0, 20)
  }
  
  // Find the device
  const device = devices.value.find(d => d.name === deviceName || d.formalName === deviceName)
  if (device) {
    // Mark device as active
    activeDevices.value.add(device.id)
    
    // Create device action event
    const actionEvent: DeviceActionEvent = {
      deviceId: device.id,
      deviceName: device.name,
      action: commandText,
      timestamp: new Date(),
      phase: currentPhase.value === 'setup' ? 'setup' : 'random'
    }
    
    deviceActions.value.set(device.id, actionEvent)
    
    // Show ghost animation
    const ghostId = ghostManager.showGhost(device.id, commandText)
    updateActiveGhosts()
    
    // Remove active state after a delay
    setTimeout(() => {
      activeDevices.value.delete(device.id)
    }, 2000)
  }
  
  // Speak the command
  speakCommand(commandText)
}

const getNextCommand = async () => {
  try {
    const response = await api.haunting.getNextCommand()
    
    if (response.command) {
      processCommand(response.command)
    } else {
      console.log('No commands available:', response.message)
    }
  } catch (error: any) {
    console.error('Failed to get next command:', error)
    
    // If session not found, stop polling
    if (error.message?.includes('No active haunting session')) {
      stopPolling()
      sessionActive.value = false
      currentPhase.value = 'idle'
    }
  }
}

const startPolling = () => {
  const poll = () => {
    getNextCommand()
    
    // Random delay between 2-5 seconds (will be configurable via settings)
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
  
  // Clear all ghosts
  ghostManager.clearAllGhosts()
  updateActiveGhosts()
  
  try {
    await api.haunting.stop()
    sessionActive.value = false
    currentPhase.value = 'idle'
    router.push('/devices')
  } catch (error: any) {
    console.error('Failed to stop haunting:', error)
    alert(`Failed to stop haunting: ${error.message}`)
  }
}

const startHauntingSession = async () => {
  try {
    currentPhase.value = 'setup'
    
    // Simulate scene setup phase
    const enabledCount = enabledDevices.value.length
    setupProgress.value = {
      totalDevices: enabledCount,
      completedDevices: 0,
      isComplete: false
    }
    
    await api.haunting.start()
    sessionActive.value = true
    
    // Simulate setup progress (in real implementation, this would come from backend)
    let completed = 0
    const setupInterval = setInterval(() => {
      if (completed < enabledCount) {
        completed++
        if (setupProgress.value) {
          setupProgress.value.completedDevices = completed
          setupProgress.value.currentDevice = enabledDevices.value[completed - 1]?.name
        }
      } else {
        clearInterval(setupInterval)
        if (setupProgress.value) {
          setupProgress.value.isComplete = true
        }
        currentPhase.value = 'active'
        startPolling()
      }
    }, 1000)
    
  } catch (error: any) {
    console.error('Failed to start haunting:', error)
    alert(`Failed to start haunting: ${error.message}`)
    router.push('/devices')
  }
}

onMounted(async () => {
  speechSynthesis = window.speechSynthesis
  await loadDevices()
  await loadSettings()
  
  if (enabledDevices.value.length === 0) {
    alert('No devices are enabled for haunting. Please configure your devices first.')
    router.push('/devices')
    return
  }
  
  startHauntingSession()
})

onUnmounted(() => {
  stopPolling()
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  ghostManager.clearAllGhosts()
})
</script>

<style scoped>
.haunting-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  padding: 2rem;
}

/* Header */
.haunting-header {
  text-align: center;
  margin-bottom: 2rem;
}

.header-content {
  max-width: 600px;
  margin: 0 auto;
}

/* Phase Indicator */
.phase-indicator {
  max-width: 800px;
  margin: 0 auto 3rem auto;
}

.phase-content {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border: 2px solid #374151;
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s ease;
}

.phase-content.phase-setup {
  border-color: #f59e0b;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
}

.phase-content.phase-active {
  border-color: #10b981;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
}

.phase-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.phase-content.phase-setup .phase-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.phase-content.phase-active .phase-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}

.phase-info {
  flex: 1;
}

.phase-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.5rem 0;
}

.phase-description {
  color: #9ca3af;
  margin: 0;
  font-size: 0.875rem;
}

.progress-info {
  flex-shrink: 0;
  min-width: 200px;
}

.progress-text {
  font-size: 0.875rem;
  color: #d1d5db;
  margin-bottom: 0.5rem;
  text-align: right;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #d97706);
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* Device Grid */
.device-grid-container {
  max-width: 1400px;
  margin: 0 auto 3rem auto;
}

.no-devices {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(31, 41, 55, 0.5);
  border: 2px dashed #374151;
  border-radius: 16px;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

/* Controls */
.controls-section {
  max-width: 600px;
  margin: 0 auto 2rem auto;
}

.controls-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

.stop-button {
  background: linear-gradient(135deg, #dc2626, #b91c1c) !important;
  border: none !important;
}

.stop-button:hover {
  background: linear-gradient(135deg, #b91c1c, #991b1b) !important;
}

.mute-button {
  border-color: #6b7280 !important;
  color: #d1d5db !important;
}

.mute-button:hover {
  border-color: #9ca3af !important;
  background: rgba(156, 163, 175, 0.1) !important;
}

/* Command History */
.command-history-section {
  max-width: 800px;
  margin: 0 auto;
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid #374151;
  border-radius: 12px;
  overflow: hidden;
}

.history-header {
  padding: 1rem 1.5rem;
  background: rgba(55, 65, 81, 0.5);
  border-bottom: 1px solid #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.2s ease;
}

.history-header:hover {
  background: rgba(55, 65, 81, 0.7);
}

.history-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.history-content {
  max-height: 300px;
  overflow-y: auto;
}

.command-list {
  padding: 1rem;
}

.command-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(55, 65, 81, 0.3);
  border: 1px solid #4b5563;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
}

.command-item:hover {
  border-color: #6b7280;
  background: rgba(55, 65, 81, 0.5);
}

.command-text {
  flex: 1;
  color: #d1d5db;
  font-size: 0.875rem;
  line-height: 1.4;
}

.command-time {
  flex-shrink: 0;
  color: #9ca3af;
  font-size: 0.75rem;
}

.no-commands {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .device-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }
  
  .phase-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .progress-info {
    min-width: auto;
    width: 100%;
  }
  
  .progress-text {
    text-align: center;
  }
}

@media (max-width: 768px) {
  .haunting-page {
    padding: 1rem;
  }
  
  .device-grid {
    grid-template-columns: 1fr;
    padding: 0.5rem;
  }
  
  .controls-grid {
    grid-template-columns: 1fr;
  }
  
  .phase-content {
    padding: 1.5rem;
  }
  
  .phase-icon {
    width: 50px;
    height: 50px;
  }
  
  .phase-title {
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .haunting-page {
    padding: 0.5rem;
  }
  
  .header-content h2 {
    font-size: 2.5rem;
  }
  
  .command-item {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .command-time {
    align-self: flex-end;
  }
}

/* Animations */
@keyframes animate-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-float {
  animation: animate-float 3s ease-in-out infinite;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .phase-content,
  .command-item,
  .progress-fill,
  .animate-float {
    transition: none;
    animation: none;
  }
}

/* Focus styles for keyboard navigation */
.history-header:focus {
  outline: 2px solid #7c3aed;
  outline-offset: 2px;
}

.device-grid:focus-within {
  outline: 2px solid #7c3aed;
  outline-offset: 4px;
  border-radius: 8px;
}
</style>