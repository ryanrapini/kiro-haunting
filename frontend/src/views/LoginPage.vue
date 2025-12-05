<template>
  <div class="max-w-md mx-auto mt-16">
    <Card class="bg-zinc-900/50 border border-purple-900/50">
      <template #title>
        <div class="text-center">
          <i class="pi pi-moon text-5xl text-orange-500 mb-4 animate-float"></i>
          <h2 class="text-3xl font-spooky text-purple-400">Login</h2>
        </div>
      </template>
      
      <template #content>
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium mb-2">Email</label>
            <InputText 
              id="email"
              v-model="formData.email" 
              type="email"
              placeholder="your@email.com"
              class="w-full"
              :invalid="!!errors.email"
              required
            />
            <small v-if="errors.email" class="text-red-400">{{ errors.email }}</small>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium mb-2">Password</label>
            <Password 
              id="password"
              v-model="formData.password" 
              placeholder="Enter your password"
              :feedback="false"
              toggleMask
              class="w-full"
              :invalid="!!errors.password"
              required
            />
            <small v-if="errors.password" class="text-red-400">{{ errors.password }}</small>
          </div>

          <Message v-if="errorMessage" severity="error" :closable="false">
            {{ errorMessage }}
          </Message>

          <Button 
            type="submit"
            label="Login" 
            icon="pi pi-sign-in"
            class="w-full"
            :loading="loading"
            severity="warning"
          />

          <div class="text-center">
            <span class="text-gray-400">Don't have an account? </span>
            <router-link to="/register" class="text-orange-500 hover:text-orange-400">
              Register here
            </router-link>
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const formData = reactive({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref('')

const validateForm = (): boolean => {
  errors.email = ''
  errors.password = ''
  
  if (!formData.email) {
    errors.email = 'Email is required'
    return false
  }
  
  if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Email is invalid'
    return false
  }
  
  if (!formData.password) {
    errors.password = 'Password is required'
    return false
  }
  
  return true
}

const handleLogin = async () => {
  errorMessage.value = ''
  
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  
  try {
    await login(formData.email, formData.password)
    router.push('/setup')
  } catch (error: any) {
    errorMessage.value = error.message || 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>
