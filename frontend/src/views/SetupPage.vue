<template>
  <div class="max-w-2xl mx-auto mt-8">
    <Card class="bg-zinc-900/50 border border-purple-900/50">
      <template #title>
        <div class="text-center">
          <i class="pi pi-cog text-5xl text-orange-500 mb-4 animate-spin-slow"></i>
          <h2 class="text-3xl font-spooky text-purple-400">Setup Your Haunted Home</h2>
          <p class="text-gray-400 text-base font-normal mt-2">
            Choose your smart home platform to get started
          </p>
        </div>
      </template>
      
      <template #content>
        <div class="space-y-8">
          <div>
            <label class="block text-lg font-medium mb-4">Select Platform</label>
            <div class="grid grid-cols-2 gap-4">
              <div 
                @click="selectedPlatform = 'alexa'"
                :class="[
                  'p-6 border-2 rounded-lg cursor-pointer transition-all',
                  selectedPlatform === 'alexa' 
                    ? 'border-orange-500 bg-orange-500/10' 
                    : 'border-gray-700 hover:border-gray-600'
                ]"
              >
                <div class="text-center">
                  <i class="pi pi-amazon text-4xl mb-3"></i>
                  <h3 class="text-xl font-semibold">Amazon Alexa</h3>
                  <p class="text-sm text-gray-400 mt-2">
                    "Alexa, turn on the lights"
                  </p>
                </div>
              </div>

              <div 
                @click="selectedPlatform = 'google'"
                :class="[
                  'p-6 border-2 rounded-lg cursor-pointer transition-all',
                  selectedPlatform === 'google' 
                    ? 'border-orange-500 bg-orange-500/10' 
                    : 'border-gray-700 hover:border-gray-600'
                ]"
              >
                <div class="text-center">
                  <i class="pi pi-google text-4xl mb-3"></i>
                  <h3 class="text-xl font-semibold">Google Home</h3>
                  <p class="text-sm text-gray-400 mt-2">
                    "Hey Google, dim the lights"
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-purple-900/20 border border-purple-900/50 rounded-lg p-4">
            <div class="flex gap-3">
              <i class="pi pi-info-circle text-purple-400 text-xl"></i>
              <div>
                <h4 class="font-semibold mb-1">Simple Mode</h4>
                <p class="text-sm text-gray-400">
                  This MVP uses Simple Mode - the browser will speak voice commands that you can use with your voice assistant. 
                  No OAuth or direct device control required!
                </p>
              </div>
            </div>
          </div>

          <Message v-if="errorMessage" severity="error" :closable="false">
            {{ errorMessage }}
          </Message>

          <Button 
            label="Continue to Device Setup" 
            icon="pi pi-arrow-right"
            iconPos="right"
            class="w-full"
            size="large"
            :disabled="!selectedPlatform"
            :loading="loading"
            severity="warning"
            @click="saveConfig"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'

const router = useRouter()

const selectedPlatform = ref<'alexa' | 'google' | null>(null)
const loading = ref(false)
const errorMessage = ref('')

const saveConfig = async () => {
  if (!selectedPlatform.value) return
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    // TODO: Call API to save config
    // For now, just store locally
    localStorage.setItem('platform', selectedPlatform.value)
    localStorage.setItem('mode', 'simple')
    
    router.push('/devices')
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to save configuration'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
</style>
