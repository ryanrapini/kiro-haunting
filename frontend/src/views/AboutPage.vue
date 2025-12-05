<template>
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12">
      <h2 class="text-5xl font-spooky text-purple-400 mb-4">About This App</h2>
      <p class="text-xl text-gray-300">
        A serverless, AI-powered haunted house orchestrator built with AWS
      </p>
    </div>

    <!-- Tech Stack Overview -->
    <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-2xl shadow-purple-900/20 mb-8">
      <template #title>
        <div class="flex items-center gap-3">
          <i class="pi pi-code text-orange-500 text-2xl"></i>
          <span class="text-2xl text-white">Technology Stack</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Frontend -->
          <div class="p-4 bg-zinc-800/50 rounded-lg border border-gray-700">
            <h3 class="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <i class="pi pi-desktop"></i>
              Frontend
            </h3>
            <ul class="space-y-2 text-gray-300 text-sm">
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-400"></i>
                <strong>Vue 3</strong> with Composition API
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-400"></i>
                <strong>TypeScript</strong> for type safety
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-400"></i>
                <strong>PrimeVue</strong> component library
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-400"></i>
                <strong>Tailwind CSS</strong> for styling
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-400"></i>
                <strong>Vite</strong> for blazing fast builds
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-400"></i>
                <strong>Web Speech API</strong> for TTS
              </li>
            </ul>
          </div>

          <!-- Backend -->
          <div class="p-4 bg-zinc-800/50 rounded-lg border border-gray-700">
            <h3 class="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <i class="pi pi-server"></i>
              Backend
            </h3>
            <ul class="space-y-2 text-gray-300 text-sm">
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-400"></i>
                <strong>AWS Lambda</strong> (Node.js 20)
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-400"></i>
                <strong>TypeScript</strong> for Lambda functions
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-400"></i>
                <strong>OpenRouter API</strong> for AI agents
              </li>
              <li class="flex items-center gap-2">
                <i class="pi pi-check text-green-400"></i>
                <strong>Multi-agent architecture</strong>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </Card>

    <!-- AWS Services -->
    <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-2xl shadow-purple-900/20 mb-8">
      <template #title>
        <div class="flex items-center gap-3">
          <i class="pi pi-cloud text-orange-500 text-2xl"></i>
          <span class="text-2xl text-white">AWS Services Used</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 bg-gradient-to-br from-orange-900/20 to-purple-900/20 rounded-lg border border-orange-500/30">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-lock text-orange-400 text-xl"></i>
              <h4 class="font-semibold text-white">Amazon Cognito</h4>
            </div>
            <p class="text-sm text-gray-400">User authentication and authorization with secure JWT tokens</p>
          </div>

          <div class="p-4 bg-gradient-to-br from-orange-900/20 to-purple-900/20 rounded-lg border border-orange-500/30">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-database text-orange-400 text-xl"></i>
              <h4 class="font-semibold text-white">DynamoDB</h4>
            </div>
            <p class="text-sm text-gray-400">NoSQL database for user configs, devices, and haunting sessions</p>
          </div>

          <div class="p-4 bg-gradient-to-br from-orange-900/20 to-purple-900/20 rounded-lg border border-orange-500/30">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-server text-orange-400 text-xl"></i>
              <h4 class="font-semibold text-white">AWS Lambda</h4>
            </div>
            <p class="text-sm text-gray-400">Serverless compute for API endpoints and AI orchestration</p>
          </div>

          <div class="p-4 bg-gradient-to-br from-orange-900/20 to-purple-900/20 rounded-lg border border-orange-500/30">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-cloud text-orange-400 text-xl"></i>
              <h4 class="font-semibold text-white">API Gateway</h4>
            </div>
            <p class="text-sm text-gray-400">RESTful API with Cognito authorization and CORS support</p>
          </div>

          <div class="p-4 bg-gradient-to-br from-orange-900/20 to-purple-900/20 rounded-lg border border-orange-500/30">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-box text-orange-400 text-xl"></i>
              <h4 class="font-semibold text-white">S3 + CloudFront</h4>
            </div>
            <p class="text-sm text-gray-400">Static website hosting with global CDN distribution</p>
          </div>

          <div class="p-4 bg-gradient-to-br from-orange-900/20 to-purple-900/20 rounded-lg border border-orange-500/30">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-cog text-orange-400 text-xl"></i>
              <h4 class="font-semibold text-white">AWS CDK</h4>
            </div>
            <p class="text-sm text-gray-400">Infrastructure as Code in TypeScript for reproducible deployments</p>
          </div>
        </div>
      </template>
    </Card>

    <!-- Architecture Diagram -->
    <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-2xl shadow-purple-900/20 mb-8">
      <template #title>
        <div class="flex items-center gap-3">
          <i class="pi pi-sitemap text-orange-500 text-2xl"></i>
          <span class="text-2xl text-white">System Architecture</span>
        </div>
      </template>
      <template #content>
        <div class="bg-zinc-800/50 rounded-lg p-6 border border-gray-700">
          <pre class="text-xs text-gray-300 overflow-x-auto">
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Vue 3 SPA   │  │ Web Speech   │  │   Cognito    │         │
│  │  (Frontend)  │  │     API      │  │     Auth     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CloudFront CDN (Global)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌────────────────┐   ┌────────────────────┐
        │   S3 Bucket    │   │   API Gateway      │
        │   (Static)     │   │   (REST API)       │
        └────────────────┘   └────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
        ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
        │  Lambda Func   │  │  Lambda Func   │  │  Lambda Func   │
        │  (Auth/Config) │  │   (Devices)    │  │  (Haunting)    │
        └────────────────┘  └────────────────┘  └────────────────┘
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
        ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
        │   DynamoDB     │  │   DynamoDB     │  │   DynamoDB     │
        │  UserConfig    │  │    Devices     │  │   Sessions     │
        └────────────────┘  └────────────────┘  └────────────────┘
                                       │
                                       ▼
                            ┌────────────────────┐
                            │   OpenRouter API   │
                            │   (AI Agents)      │
                            └────────────────────┘
          </pre>
        </div>
      </template>
    </Card>

    <!-- AI Agent Architecture -->
    <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-2xl shadow-purple-900/20 mb-8">
      <template #title>
        <div class="flex items-center gap-3">
          <i class="pi pi-sparkles text-orange-500 text-2xl"></i>
          <span class="text-2xl text-white">Multi-Agent AI System</span>
        </div>
      </template>
      <template #content>
        <div class="space-y-4">
          <p class="text-gray-300">
            The application uses a sophisticated multi-agent architecture where specialized AI agents work together to create a cohesive haunted house experience:
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 bg-zinc-800/50 rounded-lg border border-purple-500/30">
              <h4 class="font-semibold text-purple-400 mb-2 flex items-center gap-2">
                <i class="pi pi-comments"></i>
                Device Setup Agent
              </h4>
              <p class="text-sm text-gray-400">Conversational AI that helps users add devices through natural language chat</p>
            </div>

            <div class="p-4 bg-zinc-800/50 rounded-lg border border-purple-500/30">
              <h4 class="font-semibold text-purple-400 mb-2 flex items-center gap-2">
                <i class="pi pi-sitemap"></i>
                Orchestrator Agent
              </h4>
              <p class="text-sm text-gray-400">Coordinates multiple sub-agents and manages the overall haunting experience</p>
            </div>

            <div class="p-4 bg-zinc-800/50 rounded-lg border border-orange-500/30">
              <h4 class="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                <i class="pi pi-sun"></i>
                Lights Sub-Agent
              </h4>
              <p class="text-sm text-gray-400">Generates spooky lighting commands (colors, brightness, flicker effects)</p>
            </div>

            <div class="p-4 bg-zinc-800/50 rounded-lg border border-orange-500/30">
              <h4 class="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                <i class="pi pi-volume-up"></i>
                Audio Sub-Agent
              </h4>
              <p class="text-sm text-gray-400">Creates atmospheric audio commands (spooky sounds, volume control)</p>
            </div>

            <div class="p-4 bg-zinc-800/50 rounded-lg border border-orange-500/30">
              <h4 class="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                <i class="pi pi-desktop"></i>
                TV Sub-Agent
              </h4>
              <p class="text-sm text-gray-400">Controls smart TVs for visual effects and creepy content</p>
            </div>

            <div class="p-4 bg-zinc-800/50 rounded-lg border border-orange-500/30">
              <h4 class="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                <i class="pi pi-bolt"></i>
                Smart Plug Sub-Agent
              </h4>
              <p class="text-sm text-gray-400">Manages smart plugs for unexpected device control</p>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Key Features -->
    <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-2xl shadow-purple-900/20 mb-8">
      <template #title>
        <div class="flex items-center gap-3">
          <i class="pi pi-star text-orange-500 text-2xl"></i>
          <span class="text-2xl text-white">Key Features</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-start gap-3">
            <i class="pi pi-check-circle text-green-400 text-xl flex-shrink-0 mt-1"></i>
            <div>
              <h4 class="font-semibold text-white mb-1">Serverless Architecture</h4>
              <p class="text-sm text-gray-400">Fully serverless with automatic scaling and pay-per-use pricing</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <i class="pi pi-check-circle text-green-400 text-xl flex-shrink-0 mt-1"></i>
            <div>
              <h4 class="font-semibold text-white mb-1">Infrastructure as Code</h4>
              <p class="text-sm text-gray-400">Entire infrastructure defined in AWS CDK (TypeScript)</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <i class="pi pi-check-circle text-green-400 text-xl flex-shrink-0 mt-1"></i>
            <div>
              <h4 class="font-semibold text-white mb-1">AI-Powered Conversations</h4>
              <p class="text-sm text-gray-400">Natural language device setup using OpenRouter AI</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <i class="pi pi-check-circle text-green-400 text-xl flex-shrink-0 mt-1"></i>
            <div>
              <h4 class="font-semibold text-white mb-1">Multi-Agent Orchestration</h4>
              <p class="text-sm text-gray-400">Specialized agents for different device types working in harmony</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <i class="pi pi-check-circle text-green-400 text-xl flex-shrink-0 mt-1"></i>
            <div>
              <h4 class="font-semibold text-white mb-1">Browser-Based TTS</h4>
              <p class="text-sm text-gray-400">Web Speech API for voice command generation</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <i class="pi pi-check-circle text-green-400 text-xl flex-shrink-0 mt-1"></i>
            <div>
              <h4 class="font-semibold text-white mb-1">Secure Authentication</h4>
              <p class="text-sm text-gray-400">AWS Cognito with JWT tokens and API authorization</p>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Specs Documentation -->
    <Card class="bg-zinc-900/50 border border-purple-900/50 shadow-2xl shadow-purple-900/20 mb-8">
      <template #title>
        <div class="flex items-center gap-3">
          <i class="pi pi-file-edit text-orange-500 text-2xl"></i>
          <span class="text-2xl text-white">Want to see the specs for this codebase?</span>
        </div>
      </template>
      <template #content>
        <p class="text-gray-400 mb-4">
          This project was built using spec-driven development with Kiro Code. 
          Explore the detailed specifications, requirements, design documents, and implementation tasks below:
        </p>
        
        <Accordion :multiple="true" class="spec-accordion">
          <AccordionTab 
            v-for="spec in specs" 
            :key="spec.name"
            :header="spec.name"
          >
            <div class="bg-black rounded p-4 max-h-96 overflow-y-auto border border-gray-700">
              <pre class="text-sm text-white whitespace-pre-wrap font-mono leading-relaxed">{{ spec.content }}</pre>
            </div>
          </AccordionTab>
        </Accordion>
      </template>
    </Card>

    <!-- Built With Kiro -->
    <Card class="bg-gradient-to-br from-purple-900/30 to-orange-900/30 border border-purple-500/50 shadow-2xl shadow-purple-900/30">
      <template #content>
        <div class="text-center py-6">
          <i class="pi pi-code text-5xl text-purple-400 mb-4 block"></i>
          <h3 class="text-2xl font-spooky text-white mb-3">Built with Kiro Code</h3>
          <p class="text-gray-300 mb-4 max-w-2xl mx-auto">
            This entire application was developed using <strong class="text-purple-400">Kiro Code</strong>, 
            an AI-powered IDE that accelerates development through intelligent code generation, 
            spec-driven development, and seamless AWS integration.
          </p>
          <div class="flex items-center justify-center gap-6 text-sm text-gray-400">
            <span class="flex items-center gap-2">
              <i class="pi pi-check text-green-400"></i>
              Spec-Driven Development
            </span>
            <span class="flex items-center gap-2">
              <i class="pi pi-check text-green-400"></i>
              AI-Assisted Coding
            </span>
            <span class="flex items-center gap-2">
              <i class="pi pi-check text-green-400"></i>
              AWS CDK Integration
            </span>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Card from 'primevue/card'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'

interface Spec {
  name: string
  content: string
}

const specs = ref<Spec[]>([])

onMounted(async () => {
  // Fetch spec files
  const specFiles = [
    { name: 'Contest Requirements', path: '/specs/contest-requirements.md' },
    { name: 'Requirements', path: '/specs/requirements.md' },
    { name: 'Design', path: '/specs/design.md' },
    { name: 'MVP Scope', path: '/specs/mvp.md' },
    { name: 'Implementation Tasks', path: '/specs/tasks.md' }
  ]

  for (const file of specFiles) {
    try {
      const response = await fetch(file.path)
      if (response.ok) {
        const content = await response.text()
        specs.value.push({
          name: file.name,
          content
        })
      }
    } catch (error) {
      console.error(`Failed to load ${file.name}:`, error)
    }
  }
})
</script>

<style scoped>
/* Force dark mode for all accordion elements */
.spec-accordion :deep(.p-accordion) {
  background: transparent !important;
}

.spec-accordion :deep(.p-accordion-tab) {
  background: transparent !important;
  margin-bottom: 0.75rem;
}

.spec-accordion :deep(.p-accordion-header) {
  background: transparent !important;
}

.spec-accordion :deep(.p-accordion-header-link) {
  background: #18181b !important;
  border: 1px solid rgba(124, 58, 237, 0.4) !important;
  color: white !important;
  padding: 1rem 1.25rem !important;
  border-radius: 0.5rem !important;
  transition: all 0.2s ease;
  font-weight: 500;
}

.spec-accordion :deep(.p-accordion-header-link:hover) {
  background: rgba(124, 58, 237, 0.15) !important;
  border-color: rgba(124, 58, 237, 0.6) !important;
}

.spec-accordion :deep(.p-accordion-header-link:focus) {
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.5) !important;
}

.spec-accordion :deep(.p-accordion-header-text) {
  color: white !important;
}

.spec-accordion :deep(.p-accordion-toggle-icon) {
  color: rgba(251, 146, 60, 0.9) !important;
}

.spec-accordion :deep(.p-accordion-content) {
  background: transparent !important;
  border: none !important;
  padding: 0.5rem 0 !important;
  margin-bottom: 0;
  color: white !important;
}

/* Force dark background for content wrapper */
.spec-accordion :deep(.p-toggleable-content) {
  background: transparent !important;
}

/* Custom scrollbar for spec content */
.spec-accordion pre::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.spec-accordion pre::-webkit-scrollbar-track {
  background: #1a1a1a;
  border-radius: 4px;
}

.spec-accordion pre::-webkit-scrollbar-thumb {
  background: rgba(251, 146, 60, 0.5);
  border-radius: 4px;
}

.spec-accordion pre::-webkit-scrollbar-thumb:hover {
  background: rgba(251, 146, 60, 0.7);
}
</style>
