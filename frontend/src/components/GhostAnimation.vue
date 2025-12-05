<template>
  <div 
    class="ghost-animation"
    :class="{ 'epilepsy-safe': epilepsyMode }"
    :style="positionStyle"
    @animationend="handleAnimationEnd"
  >
    <!-- Ghost Sprite -->
    <div class="ghost-sprite">
      <div class="ghost-body">
        <div class="ghost-face">
          <div class="ghost-eye left"></div>
          <div class="ghost-eye right"></div>
          <div class="ghost-mouth"></div>
        </div>
        <div class="ghost-tail">
          <div class="tail-segment"></div>
          <div class="tail-segment"></div>
          <div class="tail-segment"></div>
        </div>
      </div>
    </div>

    <!-- Speech Bubble -->
    <div class="speech-bubble">
      <div class="bubble-content">
        <p class="action-text">{{ action }}</p>
      </div>
      <div class="bubble-tail"></div>
    </div>

    <!-- Magical Sparkles -->
    <div class="sparkles" v-if="!epilepsyMode">
      <div class="sparkle" v-for="i in 6" :key="i" :style="getSparkleStyle(i)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface Props {
  deviceId: string
  action: string
  position: { x: number; y: number }
  epilepsyMode?: boolean
}

interface Emits {
  (e: 'complete'): void
}

const props = withDefaults(defineProps<Props>(), {
  epilepsyMode: false
})

const emit = defineEmits<Emits>()

const animationComplete = ref(false)

const positionStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`,
}))

const getSparkleStyle = (index: number) => {
  const angle = (index * 60) * (Math.PI / 180) // Convert to radians
  const radius = 40 + Math.random() * 20
  const x = Math.cos(angle) * radius
  const y = Math.sin(angle) * radius
  
  return {
    left: `${x}px`,
    top: `${y}px`,
    animationDelay: `${Math.random() * 2}s`,
    animationDuration: `${2 + Math.random() * 2}s`
  }
}

const handleAnimationEnd = (event: AnimationEvent) => {
  if (event.animationName === 'ghost-fade-out' || event.animationName === 'ghost-fade-out-safe') {
    animationComplete.value = true
    emit('complete')
  }
}

// Auto-complete after 10 seconds as fallback
onMounted(() => {
  setTimeout(() => {
    if (!animationComplete.value) {
      animationComplete.value = true
      emit('complete')
    }
  }, 10000)
})
</script>

<style scoped>
.ghost-animation {
  position: absolute;
  z-index: 1000;
  pointer-events: none;
  animation: ghost-fade-out 10s ease-in-out forwards;
}

.ghost-animation.epilepsy-safe {
  animation: ghost-fade-out-safe 10s ease-in-out forwards;
}

/* Ghost Sprite */
.ghost-sprite {
  position: relative;
  width: 60px;
  height: 80px;
  animation: ghost-float 3s ease-in-out infinite;
}

.ghost-animation.epilepsy-safe .ghost-sprite {
  animation: ghost-float-safe 4s ease-in-out infinite;
}

.ghost-body {
  position: relative;
  width: 60px;
  height: 80px;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 50%, transparent 100%);
  border-radius: 30px 30px 0 0;
  opacity: 0.9;
  filter: drop-shadow(0 0 10px rgba(248, 250, 252, 0.3));
}

.ghost-face {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 30px;
}

.ghost-eye {
  position: absolute;
  width: 6px;
  height: 8px;
  background: #1f2937;
  border-radius: 50%;
  animation: ghost-blink 4s ease-in-out infinite;
}

.ghost-eye.left {
  left: 8px;
  top: 5px;
}

.ghost-eye.right {
  right: 8px;
  top: 5px;
}

.ghost-mouth {
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 6px;
  background: #1f2937;
  border-radius: 0 0 8px 8px;
}

.ghost-tail {
  position: absolute;
  bottom: -5px;
  left: 0;
  right: 0;
  height: 15px;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
}

.tail-segment {
  width: 12px;
  height: 15px;
  background: linear-gradient(180deg, #e2e8f0 0%, transparent 100%);
  border-radius: 0 0 6px 6px;
  animation: tail-wave 2s ease-in-out infinite;
}

.tail-segment:nth-child(2) {
  animation-delay: 0.3s;
}

.tail-segment:nth-child(3) {
  animation-delay: 0.6s;
}

/* Speech Bubble */
.speech-bubble {
  position: absolute;
  top: -60px;
  left: 70px;
  min-width: 200px;
  max-width: 300px;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: bubble-appear 1s ease-out;
}

.bubble-content {
  position: relative;
}

.action-text {
  margin: 0;
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
  line-height: 1.4;
  text-align: left;
}

.bubble-tail {
  position: absolute;
  bottom: -8px;
  left: 20px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(255, 255, 255, 0.95);
}

.bubble-tail::before {
  content: '';
  position: absolute;
  bottom: 2px;
  left: -10px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #e5e7eb;
}

/* Sparkles */
.sparkles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #fbbf24;
  border-radius: 50%;
  animation: sparkle-twinkle 3s ease-in-out infinite;
}

.sparkle::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: radial-gradient(circle, #fbbf24 0%, transparent 70%);
  border-radius: 50%;
  opacity: 0.6;
}

/* Animations */
@keyframes ghost-fade-out {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  10% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  80% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
}

@keyframes ghost-fade-out-safe {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  15% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  85% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
}

@keyframes ghost-float {
  0%, 100% {
    transform: translateY(0) rotate(-2deg);
  }
  25% {
    transform: translateY(-8px) rotate(1deg);
  }
  50% {
    transform: translateY(-4px) rotate(-1deg);
  }
  75% {
    transform: translateY(-12px) rotate(2deg);
  }
}

@keyframes ghost-float-safe {
  0%, 100% {
    transform: translateY(0) rotate(-1deg);
  }
  50% {
    transform: translateY(-6px) rotate(1deg);
  }
}

@keyframes ghost-blink {
  0%, 90%, 100% {
    transform: scaleY(1);
  }
  95% {
    transform: scaleY(0.1);
  }
}

@keyframes tail-wave {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.7);
  }
}

@keyframes bubble-appear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes sparkle-twinkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .speech-bubble {
    min-width: 150px;
    max-width: 250px;
    left: 50px;
    top: -50px;
  }
  
  .action-text {
    font-size: 0.8rem;
  }
  
  .ghost-sprite {
    width: 50px;
    height: 70px;
  }
  
  .ghost-body {
    width: 50px;
    height: 70px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .ghost-animation,
  .ghost-sprite,
  .sparkle,
  .tail-segment {
    animation-duration: 8s;
    animation-iteration-count: 1;
  }
  
  .ghost-eye {
    animation: none;
  }
}
</style>