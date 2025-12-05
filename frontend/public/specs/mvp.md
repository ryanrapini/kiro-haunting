# MVP Design Document: Haunted Home Orchestrator (Simple Mode)

## Overview

This MVP focuses on delivering a working haunted house experience using "Simple Mode" - a streamlined approach that doesn't require OAuth integration with smart home platforms. Instead, the system generates voice commands that are spoken aloud through the browser, allowing users to control any voice-assistant-enabled devices without API integration.

The MVP will be deployed on AWS with a public domain (kiro-haunting.me) and includes user authentication, device management through conversational AI, and multi-agent orchestration that produces text-to-speech commands.

## MVP Scope

**In Scope:**
- User account creation and authentication
- Platform selection (Alexa or Google Home)
- Simple Mode only (no OAuth/Connected Mode)
- Conversational device setup with AI agent
- Multi-agent orchestration producing text commands
- Text-to-speech output through browser
- Basic Halloween-themed UI
- AWS deployment with public domain

**Out of Scope (Future Phases):**
- OAuth integration (Connected Mode)
- Automatic device discovery
- Direct API control of devices
- Advanced themes and customization
- Epilepsy-safe mode controls
- System prompt editing
- Activity logging and monitoring

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Login     │  │   Device     │  │   Haunting   │      │
│  │    Page      │  │   Setup      │  │   Control    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  Web Speech API (Text-to-Speech)                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS Lambda + API Gateway                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /auth/register, /auth/login                         │   │
│  │  /devices (GET, POST, DELETE)                        │   │
│  │  /haunting/start, /haunting/stop                     │   │
│  │  /haunting/next-command (polling)                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS Services                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  DynamoDB    │  │   Cognito    │  │   OpenAI     │      │
│  │  (Devices)   │  │   (Auth)     │  │     API      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for Halloween-themed styling
- Web Speech API for text-to-speech
- Hosted on AWS S3 + CloudFront

**Backend:**
- AWS Lambda (Node.js 20) for serverless functions
- AWS API Gateway for REST API
- AWS Cognito for user authentication
- AWS DynamoDB for device storage
- OpenAI API for AI agents

**Infrastructure:**
- AWS Route 53 for domain management (kiro-haunting.me)
- AWS Certificate Manager for HTTPS
- AWS CloudFormation or CDK for infrastructure as code

## Data Models

### User Model (AWS Cognito)
```typescript
interface User {
  userId: string; // Cognito sub
  email: string;
  // Password managed by Cognito
}
```

### User Configuration (DynamoDB)
```typescript
interface UserConfig {
  userId: string; // Partition key
  platform: 'alexa' | 'google';
  mode: 'simple'; // Only simple for MVP
  createdAt: string;
  updatedAt: string;
}
```

### Device Model (DynamoDB)
```typescript
interface Device {
  userId: string; // Partition key
  deviceId: string; // Sort key (UUID)
  deviceType: 'light' | 'speaker' | 'tv' | 'smart_plug';
  deviceName: string; // e.g., "bedroom lamp"
  formalName: string; // e.g., "Bedroom Lamp"
  commandExamples: string[]; // e.g., ["turn on bedroom lamp", "set bedroom lamp to red"]
  enabled: boolean;
  createdAt: string;
}
```

### Haunting Session (DynamoDB)
```typescript
interface HauntingSession {
  userId: string; // Partition key
  sessionId: string; // Sort key
  isActive: boolean;
  startedAt: string;
  stoppedAt?: string;
  commandQueue: VoiceCommand[];
}

interface VoiceCommand {
  commandId: string;
  agentType: 'light' | 'speaker' | 'tv' | 'smart_plug';
  deviceName: string;
  commandText: string; // e.g., "Alexa, turn bedroom lamp to red"
  timestamp: string;
  spoken: boolean;
}
```

## Components and Interfaces

### 1. Frontend Components

**LoginPage Component**
- Email/password input fields
- Register and Login buttons
- Form validation
- Calls Cognito through API Gateway

**DeviceSetupPage Component**
- Platform selector (Alexa/Google radio buttons)
- Mode selector (Simple only for MVP)
- Chat interface for conversational device setup
- Device list showing added devices
- Delete device functionality
- "Start Haunting" button (appears when ≥1 device)

**HauntingControlPage Component**
- "Stop Haunting" button
- Visual indicator that haunting is active
- Polls for next command every 2-5 seconds (random delay)
- Speaks commands using Web Speech API
- Shows last spoken command

**API Client Service**
```typescript
interface APIClient {
  // Auth
  register(email: string, password: string): Promise<void>;
  login(email: string, password: string): Promise<AuthTokens>;
  
  // Configuration
  saveConfig(platform: 'alexa' | 'google', mode: 'simple'): Promise<void>;
  getConfig(): Promise<UserConfig>;
  
  // Devices
  chatWithDeviceAgent(message: string): Promise<ChatResponse>;
  getDevices(): Promise<Device[]>;
  deleteDevice(deviceId: string): Promise<void>;
  
  // Haunting
  startHaunting(): Promise<void>;
  stopHaunting(): Promise<void>;
  getNextCommand(): Promise<VoiceCommand | null>;
}
```

### 2. Backend Lambda Functions

**Auth Functions**
```typescript
// POST /auth/register
async function register(email: string, password: string): Promise<void> {
  // Use Cognito SDK to create user
  // Return success/error
}

// POST /auth/login
async function login(email: string, password: string): Promise<AuthTokens> {
  // Use Cognito SDK to authenticate
  // Return JWT tokens
}
```

**Configuration Functions**
```typescript
// POST /config
async function saveConfig(userId: string, config: UserConfig): Promise<void> {
  // Save to DynamoDB UserConfig table
}

// GET /config
async function getConfig(userId: string): Promise<UserConfig> {
  // Retrieve from DynamoDB
}
```

**Device Management Functions**
```typescript
// POST /devices/chat
async function chatWithDeviceAgent(
  userId: string, 
  message: string, 
  conversationHistory: Message[]
): Promise<ChatResponse> {
  // Call OpenAI API with device setup agent prompt
  // If agent indicates device is ready, save to DynamoDB
  // Return agent response and any created device
}

// GET /devices
async function getDevices(userId: string): Promise<Device[]> {
  // Query DynamoDB for user's devices
}

// DELETE /devices/:deviceId
async function deleteDevice(userId: string, deviceId: string): Promise<void> {
  // Delete from DynamoDB
}
```

**Haunting Functions**
```typescript
// POST /haunting/start
async function startHaunting(userId: string): Promise<void> {
  // Create HauntingSession in DynamoDB
  // Spawn sub-agents (invoke separate Lambda)
  // Generate initial command queue
}

// POST /haunting/stop
async function stopHaunting(userId: string): Promise<void> {
  // Mark session as inactive
  // Clear command queue
}

// GET /haunting/next-command
async function getNextCommand(userId: string): Promise<VoiceCommand | null> {
  // Get active session
  // Return next unspoken command
  // Mark command as spoken
  // If queue is low, trigger agent to generate more commands
}
```

**Agent Orchestrator (Background Lambda)**
```typescript
async function generateCommands(userId: string, sessionId: string): Promise<void> {
  // Get user's devices grouped by type
  // For each device type with devices:
  //   - Call OpenAI API with sub-agent prompt
  //   - Agent generates 3-5 commands for its devices
  // Add commands to session queue in DynamoDB
  // Randomize order for variety
}
```

### 3. AI Agent Prompts

**Device Setup Agent**
```
You are a helpful assistant helping a user set up devices for a haunted house experience.

Your goal is to collect the following information for each device:
1. Device type (light, speaker, tv, or smart_plug)
2. Device name (informal, e.g., "bedroom lamp")
3. Formal name (how the user refers to it with their voice assistant)
4. Optional: Example commands the user would say

Be conversational and friendly. When you have all required information, respond with:
DEVICE_READY: {json object with device details}

User's platform: {alexa|google}
```

**Lights Sub-Agent (Simple Mode)**
```
You are the Lights Sub-Agent for a haunted house experience.
Mode: Simple (generate voice commands only)
Platform: {alexa|google}

Available devices:
{device list with formal names and command examples}

Generate 3-5 spooky lighting commands that would create an eerie atmosphere.
Each command should be a complete voice command for {Alexa|Google}.

Examples:
- "Alexa, set bedroom lamp to red"
- "Alexa, dim living room lights to 20 percent"
- "Alexa, turn off kitchen lights"

Return JSON array of commands:
[
  {
    "deviceName": "bedroom lamp",
    "commandText": "Alexa, set bedroom lamp to red",
    "reasoning": "Red lighting creates ominous atmosphere"
  }
]
```

**Audio Sub-Agent (Simple Mode)**
```
You are the Audio Sub-Agent for a haunted house experience.
Mode: Simple (generate voice commands only)
Platform: {alexa|google}

Available devices:
{device list with formal names and command examples}

Generate 3-5 spooky audio commands that would create creepy sounds.
Each command should be a complete voice command for {Alexa|Google}.

Examples:
- "Alexa, play spooky sounds on living room speaker"
- "Alexa, set volume to 50 percent on bedroom speaker"
- "Alexa, play thunder sounds on kitchen speaker"

Return JSON array of commands.
```

**TV Sub-Agent (Simple Mode)**
```
You are the TV Sub-Agent for a haunted house experience.
Mode: Simple (generate voice commands only)
Platform: {alexa|google}

Available devices:
{device list with formal names and command examples}

Generate 2-3 commands for TVs that would create unsettling visuals.
Each command should be a complete voice command for {Alexa|Google}.

Examples:
- "Alexa, turn on living room TV"
- "Alexa, open YouTube on bedroom TV"
- "Alexa, turn off living room TV"

Return JSON array of commands.
```

**Smart Plug Sub-Agent (Simple Mode)**
```
You are the Smart Plug Sub-Agent for a haunted house experience.
Mode: Simple (generate voice commands only)
Platform: {alexa|google}

Available devices:
{device list with formal names and command examples}

Generate 2-3 commands for smart plugs that would create unexpected events.
Each command should be a complete voice command for {Alexa|Google}.

Examples:
- "Alexa, turn off bedroom fan"
- "Alexa, turn on kitchen coffee maker"

Return JSON array of commands.
```

## AWS Infrastructure Setup

### Step 1: Domain Configuration

1. **Route 53 Setup:**
   - Create hosted zone for `kiro-haunting.me`
   - Note the nameservers
   - Update domain registrar to use Route 53 nameservers

2. **Certificate Manager:**
   - Request SSL certificate for `kiro-haunting.me` and `*.kiro-haunting.me`
   - Validate via DNS (Route 53 makes this automatic)

### Step 2: Authentication (Cognito)

1. **Create User Pool:**
   - Email as username
   - Password requirements: min 8 chars, uppercase, lowercase, number
   - No MFA for MVP
   - No email verification required

2. **Create App Client:**
   - Enable username/password auth
   - Note the User Pool ID and Client ID

### Step 3: Database (DynamoDB)

**Create Tables:**

1. **UserConfig Table:**
   - Partition key: `userId` (String)
   - No sort key
   - On-demand billing

2. **Devices Table:**
   - Partition key: `userId` (String)
   - Sort key: `deviceId` (String)
   - On-demand billing

3. **HauntingSessions Table:**
   - Partition key: `userId` (String)
   - Sort key: `sessionId` (String)
   - GSI: `isActive-index` (for querying active sessions)
   - On-demand billing

### Step 4: Backend (Lambda + API Gateway)

1. **Create Lambda Functions:**
   - Runtime: Node.js 20
   - Functions: auth-register, auth-login, config-save, config-get, devices-chat, devices-list, devices-delete, haunting-start, haunting-stop, haunting-next-command, agent-orchestrator
   - Environment variables: COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, OPENAI_API_KEY
   - IAM role with DynamoDB and Cognito permissions

2. **Create API Gateway:**
   - REST API
   - CORS enabled for frontend domain
   - Cognito authorizer for protected routes
   - Deploy to `prod` stage

3. **Custom Domain:**
   - Map `api.kiro-haunting.me` to API Gateway
   - Use ACM certificate

### Step 5: Frontend (S3 + CloudFront)

1. **Create S3 Bucket:**
   - Name: `kiro-haunting-frontend`
   - Static website hosting enabled
   - Block public access (CloudFront will access it)

2. **Create CloudFront Distribution:**
   - Origin: S3 bucket
   - Viewer protocol: Redirect HTTP to HTTPS
   - Custom SSL certificate from ACM
   - Default root object: `index.html`
   - Error pages: 404 → /index.html (for SPA routing)

3. **Route 53 Record:**
   - Create A record for `kiro-haunting.me` → CloudFront distribution

### Step 6: Deployment Pipeline (Optional but Recommended)

- Use AWS CDK or CloudFormation to define infrastructure as code
- GitHub Actions or AWS CodePipeline for CI/CD
- Automatic deployment on push to main branch

## Implementation Approach

### Phase 1: Infrastructure Setup
1. Set up AWS account and configure CLI
2. Create DynamoDB tables
3. Set up Cognito User Pool
4. Configure domain in Route 53
5. Request SSL certificates

### Phase 2: Backend Core
1. Create Lambda functions for auth
2. Set up API Gateway with routes
3. Implement device management endpoints
4. Test with Postman/curl

### Phase 3: Frontend Core
1. Create React app with Vite
2. Implement login/register pages
3. Implement device setup page with chat
4. Connect to backend APIs
5. Test authentication flow

### Phase 4: Agent System
1. Implement device setup agent
2. Implement sub-agents for each device type
3. Create haunting orchestrator Lambda
4. Implement command queue system
5. Test command generation

### Phase 5: Haunting Experience
1. Implement haunting control page
2. Add text-to-speech using Web Speech API
3. Implement command polling
4. Add random delays between commands
5. Test end-to-end haunting flow

### Phase 6: Polish
1. Add Halloween theming to UI
2. Improve error handling
3. Add loading states
4. Deploy to production
5. Test on actual devices

## Simplified Technical Decisions

### Authentication
**Decision:** Use AWS Cognito
**Rationale:** Managed service, handles password hashing, JWT tokens, no need to build auth from scratch

### Database
**Decision:** DynamoDB with simple key-value structure
**Rationale:** Serverless, scales automatically, simple queries for MVP, no need for complex relationships

### Backend
**Decision:** AWS Lambda + API Gateway
**Rationale:** Serverless, pay per use, no server management, scales automatically

### Frontend Hosting
**Decision:** S3 + CloudFront
**Rationale:** Static hosting, CDN for fast global access, HTTPS support, cheap

### Text-to-Speech
**Decision:** Web Speech API (browser native)
**Rationale:** Free, no additional API calls, works in modern browsers, simple to implement

### AI Agents
**Decision:** OpenAI GPT-4 with structured outputs
**Rationale:** Reliable, good at following instructions, structured JSON output, widely supported

## API Endpoints

```
POST   /auth/register          - Create new user account
POST   /auth/login             - Login and get JWT tokens

POST   /config                 - Save user configuration (platform, mode)
GET    /config                 - Get user configuration

POST   /devices/chat           - Chat with device setup agent
GET    /devices                - List user's devices
DELETE /devices/:deviceId      - Delete a device

POST   /haunting/start         - Start haunting routine
POST   /haunting/stop          - Stop haunting routine
GET    /haunting/next-command  - Get next command to speak
```

## Environment Variables

```bash
# Backend Lambda
COGNITO_USER_POOL_ID=us-east-1_xxxxx
COGNITO_CLIENT_ID=xxxxx
OPENAI_API_KEY=sk-xxxxx
DYNAMODB_REGION=us-east-1

# Frontend
VITE_API_URL=https://api.kiro-haunting.me
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
```

## Testing Strategy

### Manual Testing Focus
- User registration and login flow
- Device setup conversation
- Command generation quality
- Text-to-speech clarity
- Actual device response to spoken commands
- UI responsiveness and theming

### Automated Testing (Minimal for MVP)
- Unit tests for device categorization logic
- Unit tests for command queue management
- Integration test for auth flow
- Integration test for device CRUD operations

## Security Considerations

- All API calls over HTTPS
- JWT tokens for authentication
- Cognito handles password hashing
- API Gateway validates JWT on protected routes
- DynamoDB access restricted to Lambda execution role
- OpenAI API key stored in Lambda environment variables (encrypted at rest)
- CORS configured to only allow frontend domain

## Cost Estimate (MVP)

- **Route 53:** ~$0.50/month (hosted zone)
- **Certificate Manager:** Free
- **Cognito:** Free tier (up to 50,000 MAUs)
- **DynamoDB:** Free tier likely sufficient (~$0-5/month)
- **Lambda:** Free tier likely sufficient (~$0-5/month)
- **API Gateway:** Free tier (1M requests) likely sufficient
- **S3:** ~$0.50/month
- **CloudFront:** Free tier (1TB transfer) likely sufficient
- **OpenAI API:** ~$0.01-0.10 per haunting session (depends on usage)

**Total: ~$2-10/month for MVP**

## Success Criteria

MVP is successful when:
1. ✅ User can create account and login at kiro-haunting.me
2. ✅ User can select platform (Alexa/Google) and Simple Mode
3. ✅ User can add devices through conversational chat
4. ✅ User can start haunting with at least one device
5. ✅ Browser speaks commands aloud with random delays
6. ✅ Commands are appropriate for selected platform
7. ✅ User can stop haunting
8. ✅ UI has basic Halloween theming
9. ✅ System works in a hotel room without OAuth
