<template>
  <div class="text-center py-20">
    <div class="mb-8 flex justify-center">
      <i class="pi pi-moon text-9xl text-purple-500 animate-float"></i>
    </div>
    
    <h2 class="text-5xl font-spooky text-purple-400 mb-6">
      Welcome to kiro-haunting.me
    </h2>
    
    <p class="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
      Transform your smart home into a spooky experience with AI-powered voice commands.
      Control your lights, speakers, TVs, and smart plugs to create the perfect haunted atmosphere.
    </p>

    <div class="flex gap-4 justify-center flex-wrap">
      <Button 
        label="Get Started" 
        icon="pi pi-arrow-right" 
        size="large"
        severity="warning"
        @click="router.push('/register')"
      />
      <Button 
        label="Login" 
        icon="pi pi-sign-in" 
        size="large"
        outlined
        severity="secondary"
        @click="router.push('/login')"
      />
    </div>

    <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
      <Card class="bg-zinc-900/50 border border-purple-900/50 hover:border-purple-700/70 transition-colors">
        <template #content>
          <div class="text-center p-4">
            <i class="pi pi-comments text-4xl text-orange-500 mb-4 block"></i>
            <h3 class="text-xl font-semibold mb-2 text-white">AI-Powered Setup</h3>
            <p class="text-gray-400">Chat with our AI to easily set up your devices</p>
          </div>
        </template>
      </Card>

      <Card class="bg-zinc-900/50 border border-purple-900/50 hover:border-purple-700/70 transition-colors">
        <template #content>
          <div class="text-center p-4">
            <i class="pi pi-microphone text-4xl text-orange-500 mb-4 block"></i>
            <h3 class="text-xl font-semibold mb-2 text-white">Voice Commands</h3>
            <p class="text-gray-400">Browser speaks commands to your voice assistant</p>
          </div>
        </template>
      </Card>

      <Card class="bg-zinc-900/50 border border-purple-900/50 hover:border-purple-700/70 transition-colors">
        <template #content>
          <div class="text-center p-4">
            <i class="pi pi-bolt text-4xl text-orange-500 mb-4 block animate-flicker"></i>
            <h3 class="text-xl font-semibold mb-2 text-white">Multi-Device</h3>
            <p class="text-gray-400">Orchestrate lights, audio, TV, and smart plugs</p>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'

const router = useRouter()
</script>
