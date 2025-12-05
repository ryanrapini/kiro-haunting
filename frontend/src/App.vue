<template>
  <div class="dark-mode min-h-screen">
    <header class="border-b border-purple-900/50 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-4xl font-spooky text-orange-500 flex items-center gap-3">
            <i class="pi pi-moon text-3xl animate-float"></i>
            Haunted Home Orchestrator
          </h1>
          <div v-if="isAuthenticated" class="flex items-center gap-4">
            <span class="text-gray-300">{{ userEmail }}</span>
            <Button 
              label="Logout" 
              icon="pi pi-sign-out" 
              severity="secondary" 
              text 
              @click="logout"
            />
          </div>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-6 py-8">
      <router-view />
    </main>

    <footer class="mt-16 border-t border-purple-900/50 py-6">
      <div class="container mx-auto px-6 text-center text-gray-400">
        <p class="flex items-center justify-center gap-2">
          <i class="pi pi-bolt animate-flicker"></i>
          Powered by AI & OpenRouter
          <i class="pi pi-bolt animate-flicker"></i>
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useAuth } from './composables/useAuth'

const router = useRouter()
const { isAuthenticated, userEmail, logout: authLogout } = useAuth()

const logout = async () => {
  await authLogout()
  router.push('/login')
}
</script>
