<template>
  <GhostCursor />
  <div class="dark-mode min-h-screen bg-zinc-950 text-white">
    <header class="border-b border-purple-900/50 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-4xl font-spooky text-orange-500 flex items-center gap-3">
            <i class="pi pi-moon text-3xl animate-float"></i>
            kiro-haunting.me
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

    <footer class="mt-16 border-t border-purple-900/50 py-8 bg-zinc-900/30">
      <div class="container mx-auto px-6">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="text-center md:text-left">
            <p class="text-gray-400 text-sm mb-2">
              <i class="pi pi-bolt animate-flicker text-orange-500"></i>
              <span class="font-semibold text-white ml-2">Powered by AWS & AI</span>
            </p>
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-gray-500">
              <span class="flex items-center gap-1">
                <i class="pi pi-database text-orange-400"></i>
                DynamoDB
              </span>
              <span>•</span>
              <span class="flex items-center gap-1">
                <i class="pi pi-lock text-orange-400"></i>
                Cognito
              </span>
              <span>•</span>
              <span class="flex items-center gap-1">
                <i class="pi pi-server text-orange-400"></i>
                Lambda
              </span>
              <span>•</span>
              <span class="flex items-center gap-1">
                <i class="pi pi-cloud text-orange-400"></i>
                API Gateway
              </span>
              <span>•</span>
              <span class="flex items-center gap-1">
                <i class="pi pi-box text-orange-400"></i>
                S3 + CloudFront
              </span>
            </div>
          </div>
          <div class="flex flex-col items-center md:items-end gap-2">
            <p class="text-xs text-gray-500">
              Built with <span class="text-purple-400 font-semibold">Kiro Code</span> & <span class="text-orange-400 font-semibold">AWS CDK</span>
            </p>
            <router-link 
              to="/about" 
              class="text-sm text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              <i class="pi pi-info-circle"></i>
              About This App
            </router-link>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useAuth } from './composables/useAuth'
import GhostCursor from './components/GhostCursor.vue'

const router = useRouter()
const { isAuthenticated, userEmail, logout: authLogout } = useAuth()

const logout = async () => {
  await authLogout()
  router.push('/login')
}
</script>
