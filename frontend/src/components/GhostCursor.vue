<template>
  <div 
    ref="ghostRef"
    class="ghost-cursor"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      transform: `translate(-50%, -50%) scaleX(${facingDirection})`,
    }"
  >
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="272 202 655 796" 
      width="100" 
      height="122"
      class="ghost-svg"
    >
      <defs>
        <filter id="ghost-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur1"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur2"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="25" result="blur3"/>
          <feMerge>
            <feMergeNode in="blur3"/>
            <feMergeNode in="blur2"/>
            <feMergeNode in="blur1"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Kiro Ghost body with ripple effect -->
      <path 
        class="ghost-body"
        :d="ghostPath"
        fill="white"
        :opacity="ghostOpacity"
        filter="url(#ghost-glow)"
      />
      
      <!-- Left Eye -->
      <ellipse 
        :cx="636.123 + rippleOffset.x" 
        :cy="486.742 + rippleOffset.y" 
        rx="38" 
        ry="62" 
        fill="black" 
        opacity="0.2"
      />
      
      <!-- Right Eye -->
      <ellipse 
        :cx="771.24 + rippleOffset.x" 
        :cy="486.742 + rippleOffset.y" 
        rx="38" 
        ry="62" 
        fill="black" 
        opacity="0.2"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

// 🎃 MAGIC NUMBER: Control ghost speed here (pixels per frame)
const MAX_SPEED = 4

const ghostRef = ref<HTMLElement | null>(null)
const position = ref({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
const targetPosition = ref({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
const velocity = ref({ x: 0, y: 0 })
const ripplePhase = ref(0)
const pulsePhase = ref(0)
const isMoving = ref(false)
const facingDirection = ref(1) // 1 for right, -1 for left
const isWandering = ref(true)
const wanderTarget = ref({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
const lastMouseTime = ref(Date.now())
const touchLinger = ref(false)
const touchLingerStart = ref(0)

// Base Kiro ghost path (from icon.svg)
const baseGhostPath = `M398.554 818.914C316.315 1001.03 491.477 1046.74 620.672 940.156C658.687 1059.66 801.052 970.473 852.234 877.795C964.787 673.567 919.318 465.357 907.64 422.374C827.637 129.443 427.623 128.946 358.8 423.865C342.651 475.544 342.402 534.18 333.458 595.051C328.986 625.86 325.507 645.488 313.83 677.785C306.873 696.424 297.68 712.819 282.773 740.645C259.915 783.881 269.604 867.113 387.87 823.883L399.051 818.914H398.554Z`

// Compute rippling ghost path with wave effect
const ghostPath = computed(() => {
  if (!isMoving.value) return baseGhostPath
  
  const ripple = Math.sin(ripplePhase.value) * 8
  const ripple2 = Math.cos(ripplePhase.value * 1.3) * 6
  const ripple3 = Math.sin(ripplePhase.value * 0.8) * 4
  
  // Apply subtle wave distortion to the path
  return `M${398.554 + ripple} ${818.914 + ripple2}C${316.315 + ripple2} ${1001.03 + ripple3} ${491.477 + ripple} ${1046.74 + ripple2} ${620.672 + ripple3} ${940.156 + ripple}C${658.687 + ripple2} ${1059.66 + ripple} ${801.052 + ripple} ${970.473 + ripple3} ${852.234 + ripple2} ${877.795 + ripple}C${964.787 + ripple3} ${673.567 + ripple2} ${919.318 + ripple} ${465.357 + ripple} ${907.64 + ripple2} ${422.374 + ripple3}C${827.637 + ripple} ${129.443 + ripple2} ${427.623 + ripple3} ${128.946 + ripple} ${358.8 + ripple2} ${423.865 + ripple}C${342.651 + ripple} ${475.544 + ripple3} ${342.402 + ripple2} ${534.18 + ripple} ${333.458 + ripple} ${595.051 + ripple2}C${328.986 + ripple3} ${625.86 + ripple} ${325.507 + ripple2} ${645.488 + ripple} ${313.83 + ripple} ${677.785 + ripple3}C${306.873 + ripple2} ${696.424 + ripple} ${297.68 + ripple} ${712.819 + ripple2} ${282.773 + ripple3} ${740.645 + ripple}C${259.915 + ripple} ${783.881 + ripple2} ${269.604 + ripple2} ${867.113 + ripple} ${387.87 + ripple} ${823.883 + ripple3}L${399.051 + ripple2} ${818.914 + ripple}H${398.554 + ripple}`
})

// Compute ripple offset for eyes
const rippleOffset = computed(() => ({
  x: isMoving.value ? Math.sin(ripplePhase.value) * 3 : 0,
  y: isMoving.value ? Math.cos(ripplePhase.value * 1.2) * 2 : 0
}))

// Compute opacity based on distance to target and pulse
const ghostOpacity = computed(() => {
  const dx = targetPosition.value.x - position.value.x
  const dy = targetPosition.value.y - position.value.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Base opacity from pulse (0.12 to 0.18)
  const pulseAmount = Math.sin(pulsePhase.value) * 0.03
  const baseOpacity = 0.15 + pulseAmount
  
  // Increase opacity when close to cursor (within 100px)
  const proximityBoost = distance < 100 ? (1 - distance / 100) * 0.1 : 0
  
  return Math.min(baseOpacity + proximityBoost, 0.3)
})

let animationFrameId: number | null = null

const getRandomWanderTarget = () => {
  const margin = 100
  return {
    x: margin + Math.random() * (window.innerWidth - margin * 2),
    y: margin + Math.random() * (window.innerHeight - margin * 2)
  }
}

const handleMouseMove = (e: MouseEvent) => {
  lastMouseTime.value = Date.now()
  isWandering.value = false
  touchLinger.value = false
  targetPosition.value = {
    x: e.clientX,
    y: e.clientY
  }
}

const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length > 0) {
    const touch = e.touches[0]
    lastMouseTime.value = Date.now()
    isWandering.value = false
    touchLinger.value = true
    touchLingerStart.value = Date.now()
    targetPosition.value = {
      x: touch.clientX,
      y: touch.clientY
    }
  }
}

const animate = () => {
  const now = Date.now()
  
  // Check if cursor has been inactive for 2 seconds
  if (now - lastMouseTime.value > 2000 && !isWandering.value) {
    isWandering.value = true
    wanderTarget.value = getRandomWanderTarget()
  }
  
  // Handle touch linger timeout
  if (touchLinger.value && now - touchLingerStart.value > 1000) {
    touchLinger.value = false
    isWandering.value = true
    wanderTarget.value = getRandomWanderTarget()
  }
  
  // Use wander target if wandering
  if (isWandering.value) {
    targetPosition.value = wanderTarget.value
  }
  
  // Smooth following with easing
  const dx = targetPosition.value.x - position.value.x
  const dy = targetPosition.value.y - position.value.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Check if moving
  isMoving.value = distance > 5
  
  if (distance > 1) {
    // Ease towards target
    const ease = isWandering.value ? 0.02 : 0.08
    velocity.value.x = dx * ease
    velocity.value.y = dy * ease
    
    // Cap velocity to max speed (50% when wandering)
    const speedLimit = isWandering.value ? MAX_SPEED * 0.5 : MAX_SPEED
    const speed = Math.sqrt(velocity.value.x ** 2 + velocity.value.y ** 2)
    if (speed > speedLimit) {
      velocity.value.x = (velocity.value.x / speed) * speedLimit
      velocity.value.y = (velocity.value.y / speed) * speedLimit
    }
    
    position.value.x += velocity.value.x
    position.value.y += velocity.value.y
    
    // Update facing direction based on horizontal movement
    if (Math.abs(velocity.value.x) > 0.5) {
      facingDirection.value = velocity.value.x > 0 ? 1 : -1
    }
    
    // Update ripple phase when moving
    if (isMoving.value) {
      ripplePhase.value += 0.15
    }
  } else {
    // Reached wander target, pick a new one
    if (isWandering.value && !touchLinger.value) {
      wanderTarget.value = getRandomWanderTarget()
    }
    
    // Slow down ripple when stopped
    if (ripplePhase.value > 0) {
      ripplePhase.value *= 0.95
    }
  }
  
  // Always update pulse phase for breathing effect
  pulsePhase.value += 0.03
  
  animationFrameId = requestAnimationFrame(animate)
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('touchstart', handleTouchStart)
  
  // Initialize with a random position
  position.value = getRandomWanderTarget()
  wanderTarget.value = getRandomWanderTarget()
  
  animate()
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('touchstart', handleTouchStart)
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<style scoped>
.ghost-cursor {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  will-change: transform;
}

.ghost-svg {
  filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.6))
          drop-shadow(0 0 40px rgba(255, 255, 255, 0.4))
          drop-shadow(0 0 60px rgba(255, 255, 255, 0.2));
}

.ghost-body {
  transition: d 0.1s ease-out;
}
</style>
