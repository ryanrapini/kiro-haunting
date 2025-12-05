<template>
  <div class="device-toggle">
    <div 
      class="toggle-switch"
      :class="{ 
        'enabled': enabled, 
        'disabled': !enabled,
        'loading': loading,
        'readonly': disabled
      }"
      @click="handleToggle"
    >
      <div class="toggle-slider">
        <div class="toggle-knob"></div>
      </div>
      <div class="toggle-glow" v-if="enabled"></div>
    </div>
    
    <div v-if="error" class="error-message">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  deviceId: string
  enabled: boolean
  disabled?: boolean
  loading?: boolean
}

interface Emits {
  (e: 'toggle', deviceId: string, enabled: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false
})

const emit = defineEmits<Emits>()

const error = ref<string | null>(null)
const isToggling = ref(false)

const isLoading = computed(() => props.loading || isToggling.value)

const handleToggle = async () => {
  if (props.disabled || isLoading.value) return
  
  error.value = null
  isToggling.value = true
  
  try {
    emit('toggle', props.deviceId, !props.enabled)
  } catch (err: any) {
    error.value = err.message || 'Failed to toggle device'
  } finally {
    isToggling.value = false
  }
}
</script>

<style scoped>
.device-toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 24px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.toggle-switch.enabled {
  background: linear-gradient(135deg, #f97316, #ea580c);
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.3);
}

.toggle-switch.disabled {
  background: #374151;
  border-color: #4b5563;
}

.toggle-switch.loading {
  cursor: not-allowed;
  opacity: 0.7;
}

.toggle-switch.readonly {
  cursor: not-allowed;
  opacity: 0.5;
}

.toggle-slider {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch.enabled .toggle-knob {
  transform: translateX(24px);
}

.toggle-switch.loading .toggle-knob {
  animation: pulse 1.5s ease-in-out infinite;
}

.toggle-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f97316, #ea580c);
  opacity: 0.3;
  filter: blur(4px);
  z-index: -1;
  animation: glow-pulse 2s ease-in-out infinite;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes glow-pulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

/* Hover effects */
.toggle-switch:not(.readonly):not(.loading):hover {
  transform: scale(1.05);
}

.toggle-switch.enabled:not(.readonly):not(.loading):hover {
  box-shadow: 0 0 15px rgba(249, 115, 22, 0.5);
}

.toggle-switch.disabled:not(.readonly):not(.loading):hover {
  border-color: #6b7280;
}
</style>