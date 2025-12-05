# Design Document: Enhanced Haunting Controls

## Overview

The Enhanced Haunting Controls feature extends the existing Haunted Home Orchestrator with sophisticated device management, orchestrator configuration, and immersive real-time feedback. This enhancement transforms the basic haunting experience into a highly customizable and visually engaging system.

The design builds upon the existing MVP architecture while adding new components for device-level control, timing configuration, scene setup orchestration, and animated UI feedback. The system maintains backward compatibility with existing device configurations while introducing new capabilities for frequency weighting, custom prompts, and visual monitoring.

Key enhancements include:
- **Individual Device Control**: Toggle switches and frequency settings for granular device management
- **Custom Device Prompts**: User-editable prompts that define device-specific spooky behaviors
- **Scene Setup Phase**: Coordinated initial configuration of all devices before random triggers begin
- **Orchestrator Settings**: Configurable timing parameters and enhanced epilepsy safety controls
- **Immersive UI Feedback**: Large device tiles with ghost animations and speech bubbles showing real-time actions

## Architecture

### Enhanced System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Enhanced Web Interface                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Device     │  │ Orchestrator │  │   Haunting   │      │
│  │  Management  │  │   Settings   │  │   Monitor    │      │
│  │   + Toggles  │  │   + Timing   │  │  + Tiles     │      │
│  │  + Frequency │  │  + Epilepsy  │  │  + Ghosts    │      │
│  │  + Prompts   │  │    Mode      │  │  + Bubbles   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ REST API + WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Enhanced Backend Orchestrator                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Enhanced Orchestrator Service               │   │
│  │  • Scene Setup Phase Management                       │   │
│  │  • Frequency-Weighted Device Selection                │   │
│  │  • Custom Prompt Management                           │   │
│  │  • Configurable Timing Controls                      │   │
│  │  • Real-time UI Event Broadcasting                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Enhanced   │  │   Enhanced   │  │   Enhanced   │     │
│  │    Lights    │  │    Audio     │  │  Television  │     │
│  │  Sub-Agent   │  │  Sub-Agent   │  │  Sub-Agent   │     │
│  │ + Custom     │  │ + Custom     │  │ + Custom     │     │
│  │   Prompts    │  │   Prompts    │  │   Prompts    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Enhanced   │  │   Settings   │                        │
│  │  Smart Plug  │  │  Management  │                        │
│  │  Sub-Agent   │  │   Service    │                        │
│  │ + Custom     │  │              │                        │
│  │   Prompts    │  │              │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### New Components

**Device Management Enhancement**
- Device toggle controls for enable/disable functionality
- Frequency setting controls (infrequent, normal, frequent)
- Custom prompt editor with device-type-specific defaults
- Real-time device state synchronization

**Orchestrator Settings Service**
- Configurable minimum/maximum trigger timing
- Enhanced epilepsy mode with UI-level controls
- Settings persistence and validation
- Live configuration updates during active sessions

**Scene Setup Orchestrator**
- Sequential device configuration phase
- Progress tracking and UI feedback
- Transition management to random trigger phase
- Device-specific setup command generation

**Immersive UI Components**
- Large device tiles with real-time status
- Ghost animation system with speech bubbles
- Smooth fade transitions and epilepsy-safe animations
- Responsive grid layout for multiple devices

## Components and Interfaces

### 1. Enhanced Device Management

**Device Toggle Component**
```typescript
interface DeviceToggle {
  deviceId: string;
  enabled: boolean;
  onToggle: (deviceId: string, enabled: boolean) => Promise<void>;
  disabled?: boolean; // During active haunting
}
```

**Device Settings Modal Component**
```typescript
interface DeviceSettingsModal {
  device: EnhancedDevice;
  isOpen: boolean;
  onSave: (updates: DeviceUpdates) => Promise<void>;
  onClose: () => void;
}

interface DeviceUpdates {
  frequency?: FrequencyLevel;
  customPrompt?: string;
  name?: string;
  formalName?: string;
}

enum FrequencyLevel {
  INFREQUENT = 'infrequent', // 0.5x weight
  NORMAL = 'normal',         // 1.0x weight  
  FREQUENT = 'frequent'      // 2.0x weight
}
```

**Enhanced Device API**
```typescript
interface EnhancedDeviceAPI extends DeviceAPI {
  // New device management endpoints
  toggleDevice(deviceId: string, enabled: boolean): Promise<void>;
  updateDeviceSettings(deviceId: string, settings: DeviceSettings): Promise<EnhancedDevice>;
  generateDefaultPrompt(deviceType: DeviceType): Promise<string>;
}

interface DeviceSettings {
  frequency: FrequencyLevel;
  customPrompt: string;
}
```

### 2. Orchestrator Settings Management

**Settings Service**
```typescript
interface OrchestratorSettings {
  minTriggerInterval: number; // milliseconds
  maxTriggerInterval: number; // milliseconds
  epilepsyMode: boolean;
  userId: string;
  updatedAt: string;
}

interface SettingsService {
  getSettings(userId: string): Promise<OrchestratorSettings>;
  updateSettings(userId: string, settings: Partial<OrchestratorSettings>): Promise<OrchestratorSettings>;
  validateSettings(settings: Partial<OrchestratorSettings>): ValidationResult;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

**Settings Page Component**
```typescript
interface SettingsPage {
  settings: OrchestratorSettings;
  onSave: (settings: OrchestratorSettings) => Promise<void>;
  validation: ValidationResult;
}
```

### 3. Enhanced Haunting Orchestrator

**Scene Setup Service**
```typescript
interface SceneSetupService {
  executeSceneSetup(devices: EnhancedDevice[]): Promise<SceneSetupResult>;
  generateSetupCommand(device: EnhancedDevice): Promise<VoiceCommand>;
  trackSetupProgress(sessionId: string): Promise<SetupProgress>;
}

interface SceneSetupResult {
  commands: VoiceCommand[];
  setupDuration: number;
  devicesConfigured: number;
}

interface SetupProgress {
  totalDevices: number;
  completedDevices: number;
  currentDevice?: string;
  isComplete: boolean;
}
```

**Enhanced Orchestrator Service**
```typescript
interface EnhancedOrchestrator extends HauntingOrchestrator {
  // Scene setup phase
  executeSceneSetup(): Promise<void>;
  
  // Frequency-weighted selection
  selectRandomDevice(devices: EnhancedDevice[]): EnhancedDevice;
  calculateDeviceWeights(devices: EnhancedDevice[]): Map<string, number>;
  
  // Custom prompt integration
  getDevicePrompt(device: EnhancedDevice): string;
  
  // Configurable timing
  getNextTriggerDelay(settings: OrchestratorSettings): number;
  
  // Real-time events
  broadcastDeviceAction(action: DeviceActionEvent): void;
}

interface DeviceActionEvent {
  deviceId: string;
  deviceName: string;
  action: string;
  timestamp: Date;
  phase: 'setup' | 'random';
}
```

### 4. Immersive UI Components

**Device Tile Component**
```typescript
interface DeviceTile {
  device: EnhancedDevice;
  isActive: boolean;
  lastAction?: DeviceActionEvent;
  onDeviceClick: (deviceId: string) => void;
  epilepsyMode: boolean;
}
```

**Ghost Animation Component**
```typescript
interface GhostAnimation {
  deviceId: string;
  action: string;
  position: { x: number; y: number };
  onComplete: () => void;
  epilepsyMode: boolean;
}

interface GhostManager {
  activeGhosts: Map<string, GhostAnimation>;
  showGhost(deviceId: string, action: string, position: Position): void;
  removeGhost(ghostId: string): void;
  clearAllGhosts(): void;
}
```

**Haunting Monitor Component**
```typescript
interface HauntingMonitor {
  devices: EnhancedDevice[];
  activeSession?: HauntingSession;
  setupProgress?: SetupProgress;
  settings: OrchestratorSettings;
  onStartHaunting: () => Promise<void>;
  onStopHaunting: () => Promise<void>;
}
```

## Data Models

### Enhanced Device Model

```typescript
interface EnhancedDevice extends Device {
  // New fields for enhanced controls
  frequency: FrequencyLevel;
  customPrompt?: string;
  defaultPrompt: string;
  
  // Computed fields
  selectionWeight: number; // Calculated from frequency
  lastActionTime?: Date;
  actionCount: number;
}

// Default prompts by device type
const DEFAULT_PROMPTS = {
  light: "Set the lights to a dim, eerie setting with Halloween colors like deep purple, burnt orange, or flickering candlelight whites. Create an ominous atmosphere.",
  speaker: "Play spooky atmospheric sounds such as crow caws, distant screams, ghostly whispers, howling wind, or the song 'Spooky Scary Skeletons'.",
  tv: "Find and play 'haunted house atmosphere' videos from YouTube, focusing on creepy ambiance, flickering candles, or ghostly scenes.",
  smart_plug: "Randomly turn the connected device on or off to create unexpected and unsettling moments."
} as const;
```

### Enhanced Session Model

```typescript
interface EnhancedHauntingSession extends HauntingSession {
  // Scene setup tracking
  sceneSetupComplete: boolean;
  setupProgress: SetupProgress;
  setupCommands: VoiceCommand[];
  
  // Enhanced timing
  settings: OrchestratorSettings;
  nextTriggerTime?: Date;
  
  // Action tracking
  deviceActions: DeviceActionEvent[];
  totalActions: number;
}
```

### Settings Model

```typescript
interface OrchestratorSettings {
  userId: string;
  minTriggerInterval: number; // Default: 5000ms (5 seconds)
  maxTriggerInterval: number; // Default: 30000ms (30 seconds)
  epilepsyMode: boolean;      // Default: false
  createdAt: string;
  updatedAt: string;
}

// Validation constraints
const SETTINGS_CONSTRAINTS = {
  minTriggerInterval: { min: 1000, max: 300000 }, // 1s to 5min
  maxTriggerInterval: { min: 1000, max: 600000 }, // 1s to 10min
} as const;
```

### UI State Models

```typescript
interface HauntingUIState {
  phase: 'idle' | 'setup' | 'active' | 'stopping';
  setupProgress?: SetupProgress;
  activeGhosts: Map<string, GhostAnimation>;
  deviceStates: Map<string, DeviceUIState>;
}

interface DeviceUIState {
  isFlickering: boolean;
  lastAction?: DeviceActionEvent;
  tileColor: string;
  animationState: 'idle' | 'active' | 'setup';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Device Toggle and State Management

Property 1: Toggle UI consistency
*For any* set of configured devices, the UI should display exactly one toggle switch for each device
**Validates: Requirements 1.1**

Property 2: Toggle state persistence
*For any* device toggle interaction, the device's enabled state should be immediately updated in both UI and persistent storage
**Validates: Requirements 1.2**

Property 3: Disabled device exclusion
*For any* device marked as disabled, that device should never appear in haunting activity selections
**Validates: Requirements 1.3**

Property 4: Enabled device inclusion
*For any* device marked as enabled, that device should be available for selection in haunting activities
**Validates: Requirements 1.4**

Property 5: Live toggle updates
*For any* toggle change during active haunting, the change should take effect immediately without session restart
**Validates: Requirements 1.5**

### Device Settings and Frequency Management

Property 6: Settings modal display
*For any* device click interaction, a settings modal should be displayed for that specific device
**Validates: Requirements 2.1**

Property 7: Frequency display accuracy
*For any* device with a frequency setting, the UI should display the correct current frequency value
**Validates: Requirements 2.2**

Property 8: Frequency setting persistence
*For any* frequency change, the new setting should be saved and applied to the device configuration
**Validates: Requirements 2.3**

Property 9: Frequency-weighted selection
*For any* device selection process, devices should be chosen with probability proportional to their frequency weights
**Validates: Requirements 2.4**

Property 10: Infrequent device weighting
*For any* device set with mixed frequencies, infrequent devices should be selected approximately 50% less often than normal frequency devices over many selections
**Validates: Requirements 2.5**

### Scene Setup Orchestration

Property 11: Scene setup precedence
*For any* haunting start request, scene setup phase should complete before random triggers begin
**Validates: Requirements 3.1**

Property 12: Complete device setup
*For any* scene setup execution, all enabled devices should receive exactly one setup command
**Validates: Requirements 3.2**

Property 13: Setup command generation
*For any* scene setup request for a device, a valid configuration command should be generated
**Validates: Requirements 3.3**

Property 14: Phase transition completeness
*For any* scene setup process, the system should transition to random triggers only after all devices are configured
**Validates: Requirements 3.4**

Property 15: Setup progress accuracy
*For any* active scene setup, the UI progress should accurately reflect the number of completed vs total devices
**Validates: Requirements 3.5**

### Timing Configuration

Property 16: Minimum timing compliance
*For any* configured minimum trigger interval, all actual intervals should be greater than or equal to that minimum
**Validates: Requirements 4.2**

Property 17: Maximum timing compliance
*For any* configured maximum trigger interval, all actual intervals should be less than or equal to that maximum
**Validates: Requirements 4.3**

Property 18: Interval range compliance
*For any* configured timing range, all generated intervals should fall within the specified bounds
**Validates: Requirements 4.4**

Property 19: Fixed interval consistency
*For any* configuration where minimum equals maximum timing, all intervals should be exactly that duration
**Validates: Requirements 4.5**

### Epilepsy Safety Controls

Property 20: Anti-flashing prompt injection
*For any* sub-agent prompt when epilepsy mode is enabled, the prompt should contain anti-flashing instructions
**Validates: Requirements 5.1**

Property 21: UI flashing prevention
*For any* UI element when epilepsy mode is enabled, no rapidly changing visual effects should occur
**Validates: Requirements 5.2**

Property 22: Steady tile animations
*For any* device tile animation when epilepsy mode is enabled, changes should be steady rather than flickering
**Validates: Requirements 5.3**

Property 23: Smooth ghost transitions
*For any* ghost animation when epilepsy mode is enabled, transitions should be smooth fades only
**Validates: Requirements 5.4**

Property 24: Visual frequency limits
*For any* visual feedback when epilepsy mode is enabled, change frequency should remain below 3 Hz
**Validates: Requirements 5.5**

### Device Tile Display

Property 25: Active device tile display
*For any* active haunting session, large tiles should be displayed for all and only enabled devices
**Validates: Requirements 6.1**

Property 26: Tile content completeness
*For any* displayed device tile, it should contain device name, type, current status, and last action information
**Validates: Requirements 6.2**

Property 27: Action visual feedback
*For any* device action, the corresponding device tile should show visual feedback (flicker/highlight)
**Validates: Requirements 6.3**

Property 28: Tile state synchronization
*For any* completed device action, the device tile should update to reflect the new device state
**Validates: Requirements 6.4**

Property 29: Responsive grid layout
*For any* set of multiple devices, tiles should be arranged in a responsive grid layout
**Validates: Requirements 6.5**

### Ghost Animation System

Property 30: Ghost animation triggering
*For any* device command, a ghost animation should appear near the corresponding device tile
**Validates: Requirements 7.1**

Property 31: Speech bubble content accuracy
*For any* ghost animation, the speech bubble should contain the exact action being performed on the device
**Validates: Requirements 7.2**

Property 32: Ghost fade duration
*For any* ghost animation, it should fade out over exactly 10 seconds
**Validates: Requirements 7.3**

Property 33: Multiple ghost non-overlap
*For any* simultaneous device actions, multiple ghosts should be displayed without visual overlap
**Validates: Requirements 7.4**

Property 34: Epilepsy-safe ghost movement
*For any* ghost animation when epilepsy mode is enabled, movements should be smooth without rapid changes
**Validates: Requirements 7.5**

### Settings Management

Property 35: Settings validation
*For any* settings modification, minimum time should be validated to be less than or equal to maximum time
**Validates: Requirements 8.3**

Property 36: Live settings application
*For any* settings change during active haunting, the new configuration should be applied immediately
**Validates: Requirements 8.4**

Property 37: Invalid settings prevention
*For any* invalid settings input, validation errors should be displayed and saving should be prevented
**Validates: Requirements 8.5**

### Frequency Persistence

Property 38: Frequency setting persistence
*For any* device frequency setting, the setting should be stored permanently in device configuration
**Validates: Requirements 9.1**

Property 39: Frequency setting recall
*For any* application restart, previously configured frequency settings should be restored and displayed
**Validates: Requirements 9.2**

Property 40: Consistent frequency application
*For any* haunting session, stored frequency weights should be applied consistently throughout
**Validates: Requirements 9.3**

Property 41: Frequency reset on recreation
*For any* device deletion and recreation, the frequency should reset to the default normal setting
**Validates: Requirements 9.4**

### Custom Device Prompts

Property 42: Light device default prompt
*For any* newly added light device, the generated default prompt should contain instructions for dim lighting with Halloween colors
**Validates: Requirements 10.1**

Property 43: Speaker device default prompt
*For any* newly added speaker device, the generated default prompt should contain instructions for playing spooky sounds
**Validates: Requirements 10.2**

Property 44: TV device default prompt
*For any* newly added television device, the generated default prompt should contain instructions for haunted house atmosphere videos
**Validates: Requirements 10.3**

Property 45: On/off device default prompt
*For any* newly added on/off device, the generated default prompt should contain instructions for random on/off control
**Validates: Requirements 10.4**

Property 46: Custom prompt display
*For any* device settings view, the current custom prompt should be displayed in an editable text area
**Validates: Requirements 10.5**

Property 47: Custom prompt persistence
*For any* modified device prompt, the custom prompt should be saved and associated with that specific device
**Validates: Requirements 10.6**

Property 48: Custom prompt usage priority
*For any* device with a custom prompt, the sub-agent should use the custom prompt instead of the default type-based prompt
**Validates: Requirements 10.7**

Property 49: Default prompt fallback
*For any* device without a custom prompt, the sub-agent should use the default generated prompt for that device type
**Validates: Requirements 10.8**

### Phase Status Display

Property 50: Setup progress tracking
*For any* active scene setup, the UI should display progress that accurately reflects completion status through the device list
**Validates: Requirements 11.2**

Property 51: Status indicator updates
*For any* phase transition (setup to random triggers), the UI status indicator should update to reflect the current phase
**Validates: Requirements 11.4**

Property 52: Setup animation distinction
*For any* device tile during scene setup, animations should be visually distinct from random trigger animations
**Validates: Requirements 11.5**

## Error Handling

### Enhanced Error Categories

1. **Device Toggle Errors**
   - Toggle state synchronization failures
   - Concurrent toggle modifications
   - Device state conflicts during active haunting
   - Network failures during toggle operations

2. **Frequency Configuration Errors**
   - Invalid frequency values
   - Frequency weight calculation failures
   - Selection algorithm errors with weighted devices
   - Persistence failures for frequency settings

3. **Scene Setup Errors**
   - Device setup command generation failures
   - Partial setup completion (some devices fail)
   - Setup timeout scenarios
   - Phase transition failures

4. **Timing Configuration Errors**
   - Invalid timing range configurations (min > max)
   - Timing validation failures
   - Live configuration update failures
   - Timer synchronization issues

5. **Custom Prompt Errors**
   - Prompt generation failures for new devices
   - Invalid or empty custom prompts
   - Prompt persistence failures
   - Sub-agent prompt injection errors

6. **UI Animation Errors**
   - Ghost animation rendering failures
   - Tile update synchronization issues
   - Animation performance degradation
   - Epilepsy mode transition failures

### Enhanced Error Handling Strategies

**Graceful Degradation for Device Management**
- If device toggle fails, maintain previous state and show error indicator
- If frequency weighting fails, fall back to equal probability selection
- If custom prompt fails to load, use default prompt for device type
- If scene setup partially fails, continue with successfully configured devices

**Real-time Error Recovery**
- Implement retry mechanisms for toggle operations with exponential backoff
- Provide manual refresh options for device state synchronization
- Cache device configurations locally to handle temporary network failures
- Maintain error logs with user-friendly error descriptions

**UI Error Feedback**
- Show inline validation errors for settings configurations
- Display toast notifications for successful/failed operations
- Provide clear error messages with suggested remediation steps
- Highlight problematic devices or settings with visual indicators

**State Consistency Protection**
- Implement optimistic UI updates with rollback on failure
- Validate all configuration changes before applying
- Maintain audit logs of configuration changes
- Provide configuration backup and restore functionality

## Testing Strategy

### Unit Testing

The application will use **Jest** as the testing framework for unit tests, building on the existing test infrastructure. Unit tests will focus on:

**Enhanced Device Management:**
- Device toggle state management logic
- Frequency weight calculation algorithms
- Custom prompt generation for each device type
- Device selection with frequency weighting

**Scene Setup Logic:**
- Sequential device configuration ordering
- Setup progress tracking calculations
- Phase transition conditions
- Setup command generation for different device types

**Timing Configuration:**
- Interval validation logic (min ≤ max)
- Random interval generation within bounds
- Fixed interval handling (min = max)
- Live configuration update mechanisms

**UI Component Logic:**
- Ghost animation lifecycle management
- Device tile state updates
- Settings form validation
- Epilepsy mode UI adaptations

### Property-Based Testing

The application will use **fast-check** as the property-based testing library, extending the existing property test infrastructure. Property-based tests will verify universal properties across many randomly generated inputs.

**Configuration:**
- Each property test MUST run a minimum of 100 iterations
- Custom generators for enhanced device configurations, frequency settings, and timing ranges
- Shrinking enabled to find minimal failing examples for complex interactions

**Test Organization:**
- Property tests in separate `.property.test.ts` files
- Each test MUST be tagged with format: `// Feature: enhanced-haunting-controls, Property X: [property description]`
- Tests organized by functional area (device management, timing, UI feedback)

**Enhanced Property Test Coverage:**
- All 52 correctness properties listed above MUST be implemented as property-based tests
- Generators should create realistic enhanced device configurations
- Statistical tests for frequency weighting and timing distributions
- UI state property verification with mock DOM interactions

**Example Enhanced Property Test:**
```typescript
// Feature: enhanced-haunting-controls, Property 10: Infrequent device weighting
test('infrequent devices selected 50% less often than normal frequency devices', () => {
  fc.assert(
    fc.property(
      enhancedDeviceSetGenerator(), // Mix of frequencies
      fc.integer({ min: 1000, max: 10000 }), // Selection count
      (devices, selectionCount) => {
        const selections = [];
        for (let i = 0; i < selectionCount; i++) {
          selections.push(selectRandomDevice(devices));
        }
        
        const infrequentDevices = devices.filter(d => d.frequency === 'infrequent');
        const normalDevices = devices.filter(d => d.frequency === 'normal');
        
        if (infrequentDevices.length > 0 && normalDevices.length > 0) {
          const infrequentSelections = selections.filter(s => 
            infrequentDevices.some(d => d.id === s.id)
          ).length;
          const normalSelections = selections.filter(s => 
            normalDevices.some(d => d.id === s.id)
          ).length;
          
          const ratio = infrequentSelections / normalSelections;
          // Allow for statistical variance, expect ~0.5 ratio
          expect(ratio).toBeGreaterThan(0.3);
          expect(ratio).toBeLessThan(0.7);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Enhanced integration tests will verify:
- Complete device management workflow (add, configure, toggle, delete)
- End-to-end scene setup and random trigger phases
- Settings persistence across application restarts
- Real-time UI updates during active haunting sessions
- Ghost animation synchronization with device actions

### Visual Testing

New visual testing requirements:
- Ghost animation timing and positioning accuracy
- Device tile responsive layout across screen sizes
- Epilepsy-safe mode visual compliance (no rapid changes)
- Settings page layout and form validation display

### Performance Testing

Enhanced performance considerations:
- Ghost animation performance with multiple simultaneous ghosts
- Device tile update performance with large device counts
- Frequency-weighted selection algorithm performance
- Real-time UI update performance during active haunting

## Implementation Notes

### Enhanced AI Agent Implementation

Sub-agents will be enhanced to support custom device prompts while maintaining the existing OpenAI GPT-4 integration:

**Custom Prompt Integration:**
```typescript
interface EnhancedSubAgent extends SubAgent {
  getDevicePrompt(device: EnhancedDevice): string;
  generateDefaultPrompt(deviceType: DeviceType): string;
  injectEpilepsySafety(prompt: string): string;
}
```

**Prompt Template System:**
```typescript
const PROMPT_TEMPLATES = {
  light: {
    default: "Set the lights to a dim, eerie setting with Halloween colors like deep purple, burnt orange, or flickering candlelight whites. Create an ominous atmosphere.",
    epilepsySafe: "IMPORTANT: Avoid rapid flashing or strobe effects. Use smooth, gradual transitions only."
  },
  speaker: {
    default: "Play spooky atmospheric sounds such as crow caws, distant screams, ghostly whispers, howling wind, or the song 'Spooky Scary Skeletons'.",
    epilepsySafe: "IMPORTANT: Avoid sudden loud noises or rapid audio changes."
  }
  // ... additional templates
};
```

### Frequency-Weighted Selection Algorithm

```typescript
class FrequencyWeightedSelector {
  private readonly FREQUENCY_WEIGHTS = {
    infrequent: 0.5,
    normal: 1.0,
    frequent: 2.0
  };
  
  selectRandomDevice(devices: EnhancedDevice[]): EnhancedDevice {
    const enabledDevices = devices.filter(d => d.enabled);
    const totalWeight = enabledDevices.reduce(
      (sum, device) => sum + this.FREQUENCY_WEIGHTS[device.frequency], 
      0
    );
    
    let random = Math.random() * totalWeight;
    
    for (const device of enabledDevices) {
      random -= this.FREQUENCY_WEIGHTS[device.frequency];
      if (random <= 0) {
        return device;
      }
    }
    
    return enabledDevices[enabledDevices.length - 1]; // Fallback
  }
}
```

### Scene Setup Orchestration

```typescript
class SceneSetupOrchestrator {
  async executeSceneSetup(devices: EnhancedDevice[]): Promise<SceneSetupResult> {
    const enabledDevices = devices.filter(d => d.enabled);
    const commands: VoiceCommand[] = [];
    
    // Group devices by type for sequential processing
    const devicesByType = this.groupDevicesByType(enabledDevices);
    
    for (const [deviceType, typeDevices] of devicesByType) {
      const subAgent = this.getSubAgent(deviceType);
      
      for (const device of typeDevices) {
        const setupCommand = await subAgent.generateSetupCommand(device);
        commands.push(setupCommand);
        
        // Broadcast progress update
        this.broadcastSetupProgress(device.id, commands.length, enabledDevices.length);
      }
    }
    
    return {
      commands,
      setupDuration: Date.now() - this.setupStartTime,
      devicesConfigured: commands.length
    };
  }
}
```

### Ghost Animation System

```typescript
class GhostAnimationManager {
  private activeGhosts = new Map<string, GhostAnimation>();
  private readonly GHOST_DURATION = 10000; // 10 seconds
  
  showGhost(deviceId: string, action: string, position: Position): void {
    const ghostId = `${deviceId}-${Date.now()}`;
    const ghost = new GhostAnimation({
      id: ghostId,
      deviceId,
      action,
      position,
      duration: this.GHOST_DURATION,
      epilepsyMode: this.settings.epilepsyMode
    });
    
    this.activeGhosts.set(ghostId, ghost);
    
    // Auto-remove after duration
    setTimeout(() => {
      this.removeGhost(ghostId);
    }, this.GHOST_DURATION);
  }
  
  private calculateGhostPosition(deviceTile: HTMLElement): Position {
    const rect = deviceTile.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }
}
```

### Enhanced Security Considerations

- Validate all custom prompts to prevent prompt injection attacks
- Sanitize device names and custom prompts before display
- Implement rate limiting for device toggle operations
- Encrypt custom prompts in storage alongside other sensitive data
- Validate timing configurations to prevent resource exhaustion
- Implement CSRF protection for all new configuration endpoints

### Performance Optimizations

- Implement virtual scrolling for large device lists
- Use CSS transforms for ghost animations to leverage GPU acceleration
- Debounce device toggle operations to prevent rapid state changes
- Cache frequency weights to avoid recalculation on each selection
- Implement lazy loading for device settings modals
- Use WebSocket connection pooling for real-time updates

### Accessibility Enhancements

- Provide keyboard navigation for device toggles and settings
- Add ARIA labels for ghost animations and device tiles
- Implement screen reader announcements for phase transitions
- Ensure sufficient color contrast for device status indicators
- Provide alternative text descriptions for visual animations
- Support reduced motion preferences for epilepsy-safe mode