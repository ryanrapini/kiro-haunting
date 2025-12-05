<template>
  <div 
    class="device-tile"
    :class="{ 
      'active': isActive, 
      'epilepsy-safe': epilepsyMode,
      'clickable': !!onDeviceClick
    }"
    @click="handleClick"
  >
    <!-- Device Header -->
    <div class="device-header">
      <div class="device-icon">
        <i :class="deviceIcon" class="text-2xl"></i>
      </div>
      <div class="device-info">
        <h3 class="device-name">{{ device.name }}</h3>
        <p class="device-type">{{ formatDeviceType(device.type) }}</p>
      </div>
      <div class="device-status">
        <div 
          class="status-indicator"
          :class="{ 'enabled': device.enabled, 'disabled': !device.enabled }"
        ></div>
      </div>
    </div>

    <!-- Device Status -->
    <div class="device-body">
      <div class="status-section">
        <span class="status-label">Status:</span>
        <span class="status-value" :class="statusClass">
          {{ device.enabled ? 'Enabled' : 'Disabled' }}
        </span>
      </div>

      <div class="frequency-section">
        <span class="frequency-label">Frequency:</span>
        <span class="frequency-value" :class="frequencyClass">
          {{ formatFrequency(device.frequency) }}
        </span>
      </div>

      <div v-if="lastAction" class="last-action-section">
        <span class="action-label">Last Action:</span>
        <p class="action-text">{{ lastAction.action }}</p>
        <span class="action-time">{{ formatTime(lastAction.timestamp) }}</span>
      </div>

      <div v-else class="no-action-section">
        <span class="no-action-text">No recent activity</span>
      </div>
    </div>

    <!-- Activity Indicator -->
    <div v-if="isActive" class="activity-indicator">
      <div class="pulse-ring"></div>
      <div class="pulse-dot"></div>
    </div>

    <!-- Flicker Overlay for Visual Feedback -->
    <div 
      v-if="isActive && !epilepsyMode" 
      class="flicker-overlay"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Device {
  id: string
  name: string
  type: 'light' | 'speaker' | 'tv' | 'smart_plug'
  enabled: boolean
  frequency: 'infrequent' | 'normal' | 'frequent'
  actionCount: number
}

interface DeviceActionEvent {
  deviceId: string
  deviceName: string
  action: string
  timestamp: Date
  phase: 'setup' | 'random'
}

interface Props {
  device: Device
  isActive?: boolean
  lastAction?: DeviceActionEvent
  onDeviceClick?: (deviceId: string) => void
  epilepsyMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  epilepsyMode: false
})

const deviceIcon = computed(() => {
  const iconMap = {
    light: 'pi pi-sun',
    speaker: 'pi pi-volume-up',
    tv: 'pi pi-desktop',
    smart_plug: 'pi pi-bolt'
  }
  return iconMap[props.device.type] || 'pi pi-cog'
})

const statusClass = computed(() => ({
  'status-enabled': props.device.enabled,
  'status-disabled': !props.device.enabled
}))

const frequencyClass = computed(() => ({
  'freq-infrequent': props.device.frequency === 'infrequent',
  'freq-normal': props.device.frequency === 'normal',
  'freq-frequent': props.device.frequency === 'frequent'
}))

const formatDeviceType = (type: string): string => {
  const typeMap = {
    light: 'Smart Light',
    speaker: 'Smart Speaker',
    tv: 'Smart TV',
    smart_plug: 'Smart Plug'
  }
  return typeMap[type as keyof typeof typeMap] || type
}

const formatFrequency = (frequency: string): string => {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1)
}

const formatTime = (timestamp: Date): string => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

const handleClick = () => {
  if (props.onDeviceClick) {
    props.onDeviceClick(props.device.id)
  }
}
</script>

<style scoped>
.device-tile {
  position: relative;
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border: 2px solid #374151;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  overflow: hidden;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.device-tile:hover {
  border-color: #6b7280;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.device-tile.clickable {
  cursor: pointer;
}

.device-tile.active {
  border-color: #f97316;
  box-shadow: 0 0 20px rgba(249, 115, 22, 0.4);
}

.device-tile.epilepsy-safe.active {
  border-color: #f97316;
  box-shadow: 0 0 15px rgba(249, 115, 22, 0.2);
  animation: gentle-glow 3s ease-in-out infinite;
}

/* Device Header */
.device-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.device-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.device-info {
  flex: 1;
}

.device-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.25rem 0;
}

.device-type {
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0;
}

.device-status {
  flex-shrink: 0;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-indicator.enabled {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.status-indicator.disabled {
  background: #6b7280;
}

/* Device Body */
.device-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-section,
.frequency-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-label,
.frequency-label,
.action-label {
  font-size: 0.875rem;
  color: #9ca3af;
  font-weight: 500;
}

.status-value {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.status-value.status-enabled {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.status-value.status-disabled {
  color: #6b7280;
  background: rgba(107, 114, 128, 0.1);
}

.frequency-value {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.frequency-value.freq-infrequent {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.frequency-value.freq-normal {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.frequency-value.freq-frequent {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.last-action-section {
  background: rgba(55, 65, 81, 0.5);
  border-radius: 8px;
  padding: 0.75rem;
  border-left: 3px solid #f97316;
}

.action-text {
  font-size: 0.875rem;
  color: white;
  margin: 0.25rem 0;
  line-height: 1.4;
}

.action-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.no-action-section {
  background: rgba(55, 65, 81, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  text-align: center;
}

.no-action-text {
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
}

/* Activity Indicator */
.activity-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 20px;
  height: 20px;
}

.pulse-ring {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid #f97316;
  border-radius: 50%;
  animation: pulse-ring 1.5s ease-out infinite;
}

.pulse-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: #f97316;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: pulse-dot 1.5s ease-out infinite;
}

/* Flicker Overlay for Non-Epilepsy Mode */
.flicker-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(249, 115, 22, 0.1);
  border-radius: 12px;
  animation: flicker 0.5s ease-in-out infinite alternate;
  pointer-events: none;
}

/* Responsive Grid Support */
@media (max-width: 768px) {
  .device-tile {
    min-height: 180px;
    padding: 1rem;
  }
  
  .device-name {
    font-size: 1.125rem;
  }
  
  .device-icon {
    width: 40px;
    height: 40px;
  }
}

/* Animations */
@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

@keyframes pulse-dot {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@keyframes flicker {
  0% {
    opacity: 0.1;
  }
  100% {
    opacity: 0.3;
  }
}

@keyframes gentle-glow {
  0%, 100% {
    box-shadow: 0 0 15px rgba(249, 115, 22, 0.2);
  }
  50% {
    box-shadow: 0 0 25px rgba(249, 115, 22, 0.4);
  }
}
</style>