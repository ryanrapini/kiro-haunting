<template>
  <div class="max-w-md mx-auto mt-16">
    <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-2xl shadow-purple-900/20">
      <template #title>
        <div class="text-center pt-4">
          <i class="pi pi-user-plus text-5xl text-orange-500 mb-4 block"></i>
          <h2 class="text-3xl font-spooky text-purple-400">Register</h2>
        </div>
      </template>
      
      <template #content>
        <form @submit.prevent="handleRegister" class="space-y-6 p-2">
          <div>
            <label for="email" class="block text-sm font-medium mb-2 text-gray-200">Email</label>
            <InputText 
              id="email"
              v-model="formData.email" 
              type="email"
              placeholder="your@email.com"
              class="w-full"
              :invalid="!!errors.email"
              :disabled="loading"
              required
            />
            <small v-if="errors.email" class="text-red-400 block mt-1">{{ errors.email }}</small>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium mb-2 text-gray-200">Password</label>
            <Password 
              id="password"
              v-model="formData.password" 
              placeholder="Create a password"
              toggleMask
              class="w-full"
              :invalid="!!errors.password"
              :disabled="loading"
              required
            >
              <template #footer>
                <div class="password-requirements">
                  Password must contain:
                  <ul class="list-disc list-inside mt-1 space-y-1">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number</li>
                  </ul>
                </div>
              </template>
            </Password>
            <small v-if="errors.password" class="text-red-400 block mt-1">{{ errors.password }}</small>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium mb-2 text-gray-200">Confirm Password</label>
            <Password 
              id="confirmPassword"
              v-model="formData.confirmPassword" 
              placeholder="Confirm your password"
              :feedback="false"
              toggleMask
              class="w-full"
              :invalid="!!errors.confirmPassword"
              :disabled="loading"
              required
            />
            <small v-if="errors.confirmPassword" class="text-red-400 block mt-1">{{ errors.confirmPassword }}</small>
          </div>

          <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
            {{ errorMessage }}
          </Message>

          <Message v-if="successMessage" severity="success" :closable="false" class="mb-4">
            {{ successMessage }}
          </Message>

          <Button 
            type="submit"
            label="Register" 
            icon="pi pi-user-plus"
            class="w-full"
            :loading="loading"
            severity="warning"
            size="large"
          />

          <div class="text-center pt-2">
            <span class="text-gray-400">Already have an account? </span>
            <router-link to="/login" class="text-orange-500 hover:text-orange-400 font-medium transition-colors">
              Login here
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
const { register } = useAuth()

const formData = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

const errors = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const validateForm = (): boolean => {
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''
  
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
  
  if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    return false
  }
  
  if (!/[A-Z]/.test(formData.password)) {
    errors.password = 'Password must contain an uppercase letter'
    return false
  }
  
  if (!/[a-z]/.test(formData.password)) {
    errors.password = 'Password must contain a lowercase letter'
    return false
  }
  
  if (!/[0-9]/.test(formData.password)) {
    errors.password = 'Password must contain a number'
    return false
  }
  
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    return false
  }
  
  return true
}

const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  
  try {
    await register(formData.email, formData.password)
    successMessage.value = 'Registration successful! Redirecting to login...'
    
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (error: any) {
    errorMessage.value = error.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Force dark mode for password requirements footer */
.password-requirements {
  background: rgba(39, 39, 42, 0.5) !important;
  color: rgb(156, 163, 175) !important;
  padding: 0.5rem;
  margin-top: 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  line-height: 1rem;
}

:deep(.p-password-panel) {
  background: #18181b !important;
  border: 1px solid rgba(124, 58, 237, 0.3) !important;
  color: white !important;
}

:deep(.p-password-meter) {
  background: rgba(39, 39, 42, 0.5) !important;
}
</style>
