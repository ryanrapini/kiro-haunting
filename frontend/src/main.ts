import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import './style.css'
import App from './App.vue'
import router from './router'

// Define a custom dark Halloween-themed preset
const HauntedPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{orange.50}',
      100: '{orange.100}',
      200: '{orange.200}',
      300: '{orange.300}',
      400: '{orange.400}',
      500: '{orange.500}',
      600: '{orange.600}',
      700: '{orange.700}',
      800: '{orange.800}',
      900: '{orange.900}',
      950: '{orange.950}'
    },
    colorScheme: {
      dark: {
        primary: {
          color: '{orange.500}',
          inverseColor: '{zinc.950}',
          hoverColor: '{orange.400}',
          activeColor: '{orange.600}'
        },
        surface: {
          0: '#ffffff',
          50: '{zinc.50}',
          100: '{zinc.100}',
          200: '{zinc.200}',
          300: '{zinc.300}',
          400: '{zinc.400}',
          500: '{zinc.500}',
          600: '{zinc.600}',
          700: '{zinc.700}',
          800: '{zinc.800}',
          900: '{zinc.900}',
          950: '{zinc.950}'
        },
        highlight: {
          background: '{purple.900}',
          focusBackground: '{purple.700}',
          color: '{orange.400}',
          focusColor: '{orange.300}'
        }
      }
    }
  }
})

const app = createApp(App)

app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: HauntedPreset,
    options: {
      darkModeSelector: '.dark-mode',
      cssLayer: false
    }
  }
})

app.use(router)
app.mount('#app')
