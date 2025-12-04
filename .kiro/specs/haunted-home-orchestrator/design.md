# Design Document: Haunted Home Orchestrator

## Overview

The Haunted Home Orchestrator is a multi-agent AI system that transforms smart homes into immersive haunted house experiences. The architecture consists of a web-based frontend, a Node.js backend orchestrator, and specialized AI sub-agents that control different device types. The system integrates with Amazon Alexa and Google Home through their respective APIs, discovers available devices, and coordinates spooky behaviors across lights, speakers, TVs, and smart plugs.

The application leverages a microservices-inspired architecture where each device type is managed by an independent AI agent with its own system prompt and decision-making logic. The orchestrator coordinates these agents to create cohesive, themed haunting experiences while respecting safety constraints and API rate limits.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Interface (React)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Setup      │  │   Settings   │  │   Monitor    │      │
│  │   Wizard     │  │   Panel      │  │   Dashboard  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ WebSocket + REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Orchestrator (Node.js)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Main Orchestrator Service                   │   │
│  │  • Agent Lifecycle Management                         │   │
│  │  • Device State Management                            │   │
│  │  • Theme Configuration                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Lights     │  │    Audio     │  │  Television  │     │
│  │  Sub-Agent   │  │  Sub-Agent   │  │  Sub-Agent   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Smart Plug  │  │   Rate       │                        │
│  │  Sub-Agent   │  │   Limiter    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Smart Home APIs
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Smart Home Platforms                        │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Amazon Alexa    │         │   Google Home    │         │
│  │  Smart Home API  │         │      API         │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling with custom Halloween theme
- Framer Motion for spooky animations
- Socket.io-client for real-time updates

**Backend:**
- Node.js 20+ with TypeScript
- Express.js for REST API
- Socket.io for WebSocket communication
- OpenAI API for AI agent intelligence
- OAuth 2.0 libraries for smart home authentication

**Smart Home Integration:**
- Amazon Alexa Smart Home Skill API
- Google Home Device Access API
- Alexa Skills Kit for voice commands

**Data Storage:**
- SQLite for local configuration persistence
- In-memory state management for active haunting sessions

## Components and Interfaces

### 1. Web Interface (Frontend)

**Setup Wizard Component**
- Handles OAuth flow for Alexa and Google Home
- Displays discovered devices with category grouping
- Provides device selection interface with checkboxes
- Validates configuration before proceeding

**Settings Panel Component**
- Theme selector with visual previews
- Epilepsy-safe mode toggle with warning text
- Advanced settings for system prompt editing
- Reset to defaults functionality

**Monitor Dashboard Component**
- Real-time activity feed with auto-scroll
- Device status indicators with themed animations
- Start/Stop haunting controls
- Connection status for smart home platforms

**API Client Service**
```typescript
interface APIClient {
  // Authentication
  initiateOAuth(platform: 'alexa' | 'google'): Promise<OAuthURL>;
  completeOAuth(code: string, platform: string): Promise<void>;
  
  // Device Management
  discoverDevices(): Promise<Device[]>;
  updateDeviceSelection(deviceIds: string[]): Promise<void>;
  
  // Haunting Control
  startHaunting(): Promise<void>;
  stopHaunting(): Promise<void>;
  
  // Configuration
  getThemes(): Promise<Theme[]>;
  setTheme(themeId: string): Promise<void>;
  updateAgentPrompt(agentType: string, prompt: string): Promise<void>;
  setEpilepsySafeMode(enabled: boolean): Promise<void>;
}
```

### 2. Backend Orchestrator

**Main Orchestrator Service**
```typescript
class HauntingOrchestrator {
  private subAgents: Map<DeviceType, SubAgent>;
  private deviceManager: DeviceManager;
  private themeConfig: ThemeConfiguration;
  private isHaunting: boolean;
  
  async startHaunting(): Promise<void>;
  async stopHaunting(): Promise<void>;
  async spawnSubAgents(): Promise<void>;
  async coordinateAgents(): Promise<void>;
  async restoreDeviceStates(): Promise<void>;
}
```

**Device Manager**
```typescript
interface DeviceManager {
  discoverDevices(platform: SmartHomePlatform): Promise<Device[]>;
  categorizeDevice(device: RawDevice): DeviceCategory | null;
  getDevicesByType(type: DeviceType): Device[];
  executeDeviceAction(deviceId: string, action: DeviceAction): Promise<void>;
  getDeviceState(deviceId: string): Promise<DeviceState>;
  saveDeviceState(deviceId: string, state: DeviceState): Promise<void>;
}
```

**Rate Limiter Service**
```typescript
class RateLimiter {
  private requestCounts: Map<string, number[]>;
  private limits: Map<string, RateLimit>;
  
  async checkLimit(platform: string): Promise<boolean>;
  async waitForAvailability(platform: string): Promise<void>;
  recordRequest(platform: string): void;
  implementBackoff(platform: string, attempt: number): Promise<void>;
}
```

### 3. Sub-Agent System

**Base Sub-Agent Interface**
```typescript
interface SubAgent {
  agentType: DeviceType;
  systemPrompt: string;
  devices: Device[];
  theme: Theme;
  epilepsySafeMode: boolean;
  
  initialize(): Promise<void>;
  executeAction(): Promise<AgentAction>;
  terminate(): Promise<void>;
  updateSystemPrompt(prompt: string): void;
}
```

**Lights Sub-Agent**
- Controls brightness (0-100%)
- Manages color (RGB or temperature)
- Creates flickering effects
- Implements gradual transitions
- Respects epilepsy-safe mode (max 2 Hz changes)

**Audio Sub-Agent**
- Plays sound effects from library
- Controls volume levels
- Creates spatial audio effects (if supported)
- Manages playback timing and duration

**Television Sub-Agent**
- Displays static/creepy images
- Controls input switching
- Manages screen brightness
- Respects epilepsy-safe mode (no rapid flashing)

**Smart Plug Sub-Agent**
- Controls on/off states
- Implements random timing patterns
- Avoids rapid cycling (device protection)
- Coordinates with other agents for effect timing

### 4. Smart Home Platform Integration

**Alexa Integration Service**
```typescript
interface AlexaService {
  authenticate(code: string): Promise<AccessToken>;
  discoverDevices(token: AccessToken): Promise<AlexaDevice[]>;
  sendDirective(deviceId: string, directive: AlexaDirective): Promise<void>;
  registerSkill(): Promise<SkillInfo>;
  handleSkillRequest(request: SkillRequest): Promise<SkillResponse>;
}
```

**Google Home Integration Service**
```typescript
interface GoogleHomeService {
  authenticate(code: string): Promise<AccessToken>;
  discoverDevices(token: AccessToken): Promise<GoogleDevice[]>;
  executeCommand(deviceId: string, command: GoogleCommand): Promise<void>;
  syncDevices(): Promise<void>;
}
```

## Data Models

### Device Models

```typescript
enum DeviceType {
  LIGHT = 'light',
  SPEAKER = 'speaker',
  TV = 'tv',
  SMART_PLUG = 'smart_plug',
  UNKNOWN = 'unknown'
}

interface Device {
  id: string;
  name: string;
  type: DeviceType;
  platform: 'alexa' | 'google';
  capabilities: DeviceCapability[];
  enabled: boolean;
  currentState: DeviceState;
}

interface DeviceCapability {
  type: string; // 'brightness', 'color', 'power', 'volume', etc.
  min?: number;
  max?: number;
  values?: string[];
}

interface DeviceState {
  power: boolean;
  brightness?: number;
  color?: RGB;
  volume?: number;
  input?: string;
  [key: string]: any;
}

interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}
```

### Configuration Models

```typescript
interface Theme {
  id: string;
  name: string;
  description: string;
  agentPrompts: Map<DeviceType, string>;
  intensity: 'subtle' | 'moderate' | 'intense';
}

interface SystemConfiguration {
  selectedDevices: string[];
  activeTheme: string;
  epilepsySafeMode: boolean;
  customPrompts: Map<DeviceType, string>;
  platforms: PlatformConfig[];
}

interface PlatformConfig {
  platform: 'alexa' | 'google';
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}
```

### Agent Models

```typescript
interface AgentAction {
  agentType: DeviceType;
  deviceId: string;
  action: string;
  parameters: Record<string, any>;
  timestamp: Date;
  reasoning?: string; // Optional AI reasoning for debugging
}

interface AgentState {
  isActive: boolean;
  lastAction: Date;
  actionCount: number;
  errors: AgentError[];
}

interface AgentError {
  timestamp: Date;
  deviceId: string;
  error: string;
  recovered: boolean;
}
```

### Activity Log Models

```typescript
interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  agentType: DeviceType;
  deviceName: string;
  action: string;
  success: boolean;
  details?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Authentication and Platform Integration

Property 1: OAuth flow initiation
*For any* smart home platform (Alexa or Google), when a user selects that platform, the system should initiate the OAuth authentication flow for that specific platform.
**Validates: Requirements 1.2**

Property 2: Credential storage on success
*For any* successful authentication response, the system should securely store the access credentials and associate them with the correct platform.
**Validates: Requirements 1.3**

Property 3: Authentication error handling
*For any* authentication failure, the system should display an error message and provide a retry mechanism without losing previous configuration.
**Validates: Requirements 1.4**

### Device Discovery and Management

Property 4: Device API query on valid credentials
*For any* valid platform credentials, the system should query the smart home platform API to retrieve all connected devices.
**Validates: Requirements 2.1**

Property 5: Device categorization consistency
*For any* discovered device with recognizable capabilities, the system should categorize it into exactly one device type (lights, speakers, TVs, or smart plugs).
**Validates: Requirements 2.2**

Property 6: Uncategorizable device exclusion
*For any* device that cannot be categorized into a supported type, the system should exclude it from the available devices list.
**Validates: Requirements 2.4**

Property 7: Device selection persistence
*For any* set of selected devices, when a user confirms their selection, the system should store exactly that set of device IDs for use in the haunting routine.
**Validates: Requirements 3.3**

### Haunting Orchestration

Property 8: Sub-agent spawning completeness
*For any* set of enabled device types, when the haunting routine starts, the system should spawn exactly one sub-agent for each unique device type present.
**Validates: Requirements 5.1**

Property 9: Device assignment correctness
*For any* spawned sub-agent, the system should provide it with all and only the devices that match its device type.
**Validates: Requirements 5.2**

Property 10: Device state round-trip
*For any* set of devices with recorded initial states, after starting and stopping the haunting routine, all devices should return to their original states.
**Validates: Requirements 5.5, 11.3**

Property 11: Duplicate trigger idempotence
*For any* running haunting routine, triggering the routine again should have no effect on the number of active sub-agents or device states.
**Validates: Requirements 4.4**

Property 12: Agent termination completeness
*For any* active haunting routine, when the stop command is issued, all sub-agents should be terminated and no agents should remain active.
**Validates: Requirements 11.2**

### Safety and Constraints

Property 13: Safe operating parameters
*For any* device action generated by a sub-agent, the action parameters should fall within the device's safe operating range (e.g., brightness 0-100%, volume within device limits).
**Validates: Requirements 6.5**

Property 14: Epilepsy-safe frequency limit
*For any* sequence of light brightness changes when epilepsy-safe mode is enabled, the frequency of changes should not exceed 2 Hz.
**Validates: Requirements 8.3**

Property 15: Safety mode persistence
*For any* haunting session with epilepsy-safe mode enabled, all sub-agents should maintain safety restrictions throughout the entire session.
**Validates: Requirements 8.5**

### Configuration Management

Property 16: Theme prompt propagation
*For any* theme selection, all sub-agent system prompts should be updated to match the prompts defined in that theme's configuration.
**Validates: Requirements 7.2**

Property 17: Prompt modification validation
*For any* system prompt modification attempt, if the new prompt is empty or whitespace-only, the system should reject the modification and preserve the existing prompt.
**Validates: Requirements 9.3**

Property 18: Configuration update immediacy
*For any* saved configuration change (theme, prompt, or safety setting), the change should be reflected in active sub-agents within the current haunting session.
**Validates: Requirements 9.4**

### Activity Logging and Monitoring

Property 19: Action logging completeness
*For any* device action performed by a sub-agent, the system should create an activity log entry containing timestamp, agent type, device name, action description, and success status.
**Validates: Requirements 10.2**

Property 20: Log persistence after stop
*For any* haunting session, when the routine stops, all activity log entries from that session should remain accessible for review.
**Validates: Requirements 10.4**

Property 21: Log rotation at capacity
*For any* activity feed with more than 100 entries, the system should remove the oldest entries such that the feed contains at most 100 entries.
**Validates: Requirements 10.5**

### Rate Limiting

Property 22: API request tracking
*For any* API call made to a smart home platform, the system should record the timestamp and platform in its rate limiting tracker.
**Validates: Requirements 12.1**

Property 23: Exponential backoff on rate limit
*For any* rate limit error received from a platform, the system should wait for an exponentially increasing duration before retrying (e.g., 1s, 2s, 4s, 8s).
**Validates: Requirements 12.3**

Property 24: Throttling under rate limits
*For any* situation where the system is approaching rate limits, sub-agent action frequency should be reduced proportionally to stay within limits.
**Validates: Requirements 12.2, 12.4**

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Invalid OAuth codes
   - Expired tokens
   - Revoked permissions
   - Network failures during auth

2. **Device Communication Errors**
   - Device offline
   - Command timeout
   - Unsupported command
   - Rate limit exceeded

3. **Agent Errors**
   - AI API failures
   - Invalid action generation
   - Device state conflicts
   - Resource exhaustion

4. **Configuration Errors**
   - Invalid theme data
   - Malformed system prompts
   - Missing required settings
   - Incompatible device selections

### Error Handling Strategies

**Graceful Degradation**
- If a device becomes unavailable, continue haunting with remaining devices
- If one sub-agent fails, other agents continue operating
- If AI API is unavailable, fall back to predefined action patterns

**User Notification**
- Display clear, actionable error messages in the UI
- Provide specific device names when device errors occur
- Suggest remediation steps (e.g., "Check if device is powered on")
- Log all errors to activity feed with error icon

**Automatic Recovery**
- Implement exponential backoff for transient failures
- Retry failed device commands up to 3 times
- Refresh expired tokens automatically
- Re-discover devices if communication fails

**State Consistency**
- Always attempt to restore device states on error
- Maintain activity log even if haunting terminates unexpectedly
- Preserve user configuration across errors
- Provide manual device control if automatic restoration fails

## Testing Strategy

### Unit Testing

The application will use **Jest** as the testing framework for unit tests. Unit tests will focus on:

**Core Logic Components:**
- Device categorization logic (testing specific device capability patterns)
- Rate limiter calculations (testing specific time windows and limits)
- Configuration validation (testing specific invalid inputs)
- OAuth token refresh logic (testing specific expiration scenarios)

**Integration Points:**
- API client request formatting (testing specific API call structures)
- WebSocket message handling (testing specific message types)
- Database operations (testing specific CRUD operations)

**Edge Cases:**
- Empty device lists
- Single device scenarios
- Maximum device counts
- Boundary values for brightness, volume, etc.

Unit tests should be co-located with source files using `.test.ts` suffix and run with `npm test`.

### Property-Based Testing

The application will use **fast-check** as the property-based testing library. Property-based tests will verify universal properties across many randomly generated inputs.

**Configuration:**
- Each property test MUST run a minimum of 100 iterations
- Tests should use custom generators for domain-specific types (devices, themes, configurations)
- Shrinking should be enabled to find minimal failing examples

**Test Organization:**
- Property tests will be in separate `.property.test.ts` files
- Each test MUST be tagged with a comment referencing the design document property
- Tag format: `// Feature: haunted-home-orchestrator, Property X: [property description]`

**Property Test Coverage:**
- Each correctness property listed above MUST be implemented as a single property-based test
- Generators should create realistic test data (valid device IDs, reasonable brightness values, etc.)
- Tests should verify both success cases and error handling

**Example Property Test Structure:**
```typescript
// Feature: haunted-home-orchestrator, Property 5: Device categorization consistency
test('any discovered device with recognizable capabilities is categorized into exactly one type', () => {
  fc.assert(
    fc.property(
      deviceGenerator(), // Custom generator for devices
      (device) => {
        const category = categorizeDevice(device);
        if (category !== null) {
          expect(['light', 'speaker', 'tv', 'smart_plug']).toContain(category);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests will verify:
- End-to-end OAuth flows with mock smart home APIs
- Complete haunting routine lifecycle (start, run, stop)
- WebSocket communication between frontend and backend
- Database persistence across application restarts

### Manual Testing

Manual testing will focus on:
- Visual appearance and Halloween theming
- Animation smoothness and timing
- Real device behavior with actual Alexa/Google Home devices
- User experience and workflow clarity

## Implementation Notes

### AI Agent Implementation

Sub-agents will use OpenAI's GPT-4 API with structured outputs to generate device actions. Each agent will:

1. Receive context about current device states and theme
2. Generate a JSON action object specifying device and parameters
3. Include reasoning for debugging purposes
4. Respect safety constraints through system prompt engineering

**Example System Prompt Structure:**
```
You are the Lights Sub-Agent for a haunted house experience.
Theme: {theme_name}
Epilepsy-Safe Mode: {enabled/disabled}

Your goal is to create {theme_description} lighting effects.

Available devices: {device_list}

Constraints:
- Brightness must be 0-100
- Color must be valid RGB
- {epilepsy_safe_mode ? "Change frequency must not exceed 2 Hz" : ""}

Generate the next lighting action as JSON:
{
  "deviceId": "string",
  "action": "setBrightness" | "setColor" | "toggle",
  "parameters": { ... },
  "reasoning": "why this action fits the theme"
}
```

### Voice Command Integration

**Alexa Implementation:**
- Create a custom Alexa Skill with Smart Home capabilities
- Register custom intent "BeginHauntingIntent"
- Use Alexa Skills Kit to handle voice commands
- Skill backend will trigger webhook to orchestrator

**Google Home Implementation:**
- Create a Google Action with Device Control
- Register custom command phrase
- Use Actions on Google to handle voice commands
- Action will trigger webhook to orchestrator

### Performance Considerations

- Use WebSocket for real-time updates to avoid polling
- Implement connection pooling for smart home API calls
- Cache device states to minimize API queries
- Use worker threads for AI agent processing if needed
- Implement request batching where platform APIs support it

### Security Considerations

- Store OAuth tokens encrypted at rest
- Use HTTPS for all API communication
- Implement CSRF protection for web interface
- Validate all user inputs before processing
- Rate limit API endpoints to prevent abuse
- Never log sensitive credentials or tokens
