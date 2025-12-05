# Implementation Plan: Enhanced Haunting Controls

This implementation plan extends the existing Haunted Home Orchestrator MVP with advanced device management, orchestrator settings, and immersive UI feedback. Each task builds incrementally on the existing system while adding new capabilities for device control, timing configuration, and visual monitoring.

## Tasks

- [x] 1. Enhance device data model and backend services
- [x] 1.1 Update Device model with enhanced fields
  - Add frequency field (FrequencyLevel enum: infrequent, normal, frequent) to Device interface in backend/src/models/types.ts
  - Add customPrompt and defaultPrompt fields to Device interface
  - Add selectionWeight computed field and actionCount tracking
  - Create FREQUENCY_WEIGHTS constant mapping and DEFAULT_PROMPTS by device type
  - _Requirements: 2.1, 2.2, 9.1, 10.1-10.4_

- [x] 1.2 Implement enhanced device service functions
  - Create generateDefaultPrompt function in backend/src/services/deviceService.ts for each device type
  - Implement updateDeviceSettings function to handle frequency and custom prompt updates
  - Add toggleDevice function to enable/disable devices
  - Create calculateSelectionWeight function using frequency weights
  - _Requirements: 1.2, 2.3, 10.1-10.4_

- [x] 1.3 Create enhanced device API handlers
  - Create PUT /devices/:id/toggle handler in backend/src/handlers/devices.ts
  - Create PUT /devices/:id/settings handler for frequency and prompt updates
  - Add validation for frequency values and non-empty prompts
  - Export new handlers in backend/src/index.ts
  - _Requirements: 1.2, 2.3, 10.6_

- [x] 1.4 Write property tests for device enhancements
  - **Property 2: Toggle state persistence**
  - **Property 8: Frequency setting persistence**
  - **Property 42-45: Default prompt generation for each device type**
  - **Validates: Requirements 1.2, 2.3, 10.1-10.4**

- [x] 2. Implement orchestrator settings management
- [x] 2.1 Create OrchestratorSettings model and service
  - Define OrchestratorSettings interface in backend/src/models/types.ts
  - Create SettingsService in backend/src/services/settingsService.ts
  - Implement getSettings, updateSettings, and validateSettings functions
  - Add SETTINGS_CONSTRAINTS for timing validation (min ≤ max)
  - _Requirements: 4.1, 8.1, 8.3_

- [x] 2.2 Create settings API handlers
  - Create GET /settings handler in backend/src/handlers/settings.ts
  - Create PUT /settings handler with validation
  - Implement settings validation logic (minimum ≤ maximum timing)
  - Export handlers in backend/src/index.ts
  - _Requirements: 4.1, 8.3, 8.5_

- [x] 2.3 Write property tests for settings management
  - **Property 35: Settings validation**
  - **Property 37: Invalid settings prevention**
  - **Validates: Requirements 8.3, 8.5**

- [ ] 3. Enhance haunting orchestrator with scene setup and frequency weighting
- [ ] 3.1 Implement scene setup orchestration
  - Create SceneSetupService in backend/src/services/sceneSetupService.ts
  - Implement executeSceneSetup function to configure all enabled devices sequentially
  - Create generateSetupCommand function for device-specific setup commands
  - Add progress tracking and phase transition logic
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3.2 Implement frequency-weighted device selection
  - Create FrequencyWeightedSelector class in backend/src/services/orchestratorService.ts
  - Implement selectRandomDevice function using frequency weights (infrequent: 0.5x, normal: 1.0x, frequent: 2.0x)
  - Add device filtering for enabled devices only
  - Create calculateDeviceWeights helper function
  - _Requirements: 1.3, 1.4, 2.4, 2.5_

- [ ] 3.3 Enhance haunting service with configurable timing
  - Update HauntingService in backend/src/services/hauntingService.ts
  - Implement getNextTriggerDelay function using orchestrator settings
  - Add random interval generation within min/max bounds
  - Handle fixed interval case (min = max)
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 3.4 Update haunting handlers with enhanced orchestration
  - Modify startHaunting handler in backend/src/handlers/haunting.ts to include scene setup phase
  - Update command generation to use custom device prompts when available
  - Implement live settings application during active sessions
  - Add real-time event broadcasting for UI updates
  - _Requirements: 3.1, 8.4, 10.7, 10.8_

- [ ] 3.5 Write property tests for enhanced orchestration
  - **Property 10: Infrequent device weighting**
  - **Property 11: Scene setup precedence**
  - **Property 12: Complete device setup**
  - **Property 16-19: Timing configuration compliance**
  - **Validates: Requirements 2.5, 3.1, 3.2, 4.2-4.5**

- [ ] 4. Create enhanced frontend device management UI
- [ ] 4.1 Create DeviceToggle component
  - Create DeviceToggle.vue component in frontend/src/components/
  - Implement toggle switch UI with enabled/disabled states
  - Add immediate state updates and API integration
  - Handle loading states and error feedback
  - _Requirements: 1.1, 1.2_

- [ ] 4.2 Create enhanced DeviceSettingsModal component
  - Create DeviceSettingsModal.vue in frontend/src/components/
  - Add frequency selector (infrequent, normal, frequent) with radio buttons
  - Implement custom prompt editor with textarea
  - Add device name and formal name editing
  - Include save/cancel functionality with validation
  - _Requirements: 2.1, 2.2, 2.3, 10.5, 10.6_

- [ ] 4.3 Update DevicesPage with enhanced controls
  - Add DeviceToggle components to each device card in DevicesPage.vue
  - Integrate DeviceSettingsModal with device click handlers
  - Update device list to show frequency and custom prompt status
  - Add visual indicators for device enabled/disabled state
  - _Requirements: 1.1, 2.1, 2.2_

- [ ] 4.4 Update API client with enhanced device methods
  - Add toggleDevice, updateDeviceSettings methods to frontend/src/services/api.ts
  - Implement generateDefaultPrompt API call
  - Add error handling for device management operations
  - Update existing device methods to handle enhanced fields
  - _Requirements: 1.2, 2.3, 10.1-10.4_

- [ ] 4.5 Write property tests for device management UI
  - **Property 1: Toggle UI consistency**
  - **Property 6: Settings modal display**
  - **Property 7: Frequency display accuracy**
  - **Validates: Requirements 1.1, 2.1, 2.2**

- [ ] 5. Implement orchestrator settings page
- [ ] 5.1 Create SettingsPage component
  - Create SettingsPage.vue in frontend/src/views/
  - Add minimum/maximum trigger timing controls with number inputs
  - Implement epilepsy mode toggle with warning text
  - Add form validation for timing constraints (min ≤ max)
  - Include save/reset functionality
  - _Requirements: 4.1, 8.1, 8.2, 8.3_

- [ ] 5.2 Add settings navigation and routing
  - Add SettingsPage route to frontend/src/router/
  - Create navigation link in main app navigation
  - Add settings icon and menu item
  - _Requirements: 8.1_

- [ ] 5.3 Integrate settings API client
  - Add getSettings, updateSettings methods to frontend/src/services/api.ts
  - Implement settings validation on frontend
  - Add error handling and success feedback
  - _Requirements: 8.2, 8.3, 8.5_

- [ ] 5.4 Write property tests for settings management
  - **Property 35: Settings validation**
  - **Property 36: Live settings application**
  - **Validates: Requirements 8.3, 8.4**

- [ ] 6. Create immersive haunting UI with device tiles and ghost animations
- [ ] 6.1 Create DeviceTile component
  - Create DeviceTile.vue in frontend/src/components/
  - Implement large tile layout with device name, type, status, and last action
  - Add visual feedback for device actions (flicker/highlight)
  - Create responsive grid layout for multiple tiles
  - Include epilepsy-safe animation modes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6.2 Create GhostAnimation component
  - Create GhostAnimation.vue in frontend/src/components/
  - Implement ghost sprite with speech bubble
  - Add 10-second fade-out animation
  - Create positioning system relative to device tiles
  - Handle multiple simultaneous ghosts without overlap
  - Include epilepsy-safe smooth transitions
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 6.3 Create GhostManager service
  - Create GhostManager class in frontend/src/services/ghostManager.ts
  - Implement showGhost, removeGhost, and clearAllGhosts methods
  - Add ghost positioning calculation relative to device tiles
  - Handle ghost lifecycle and cleanup
  - _Requirements: 7.1, 7.3, 7.4_

- [ ] 6.4 Update HauntingPage with enhanced UI
  - Replace simple command display with DeviceTile grid in HauntingPage.vue
  - Integrate GhostAnimation system with device actions
  - Add phase indicators for scene setup vs random triggers
  - Implement real-time device state updates
  - Add progress display for scene setup phase
  - _Requirements: 6.1, 11.1, 11.2, 11.4_

- [ ] 6.5 Write property tests for immersive UI
  - **Property 25: Active device tile display**
  - **Property 30: Ghost animation triggering**
  - **Property 32: Ghost fade duration**
  - **Validates: Requirements 6.1, 7.1, 7.3**

- [ ] 7. Enhance epilepsy safety controls
- [ ] 7.1 Implement enhanced epilepsy mode in sub-agents
  - Update sub-agent prompts in backend/src/prompts/subAgents.ts
  - Add anti-flashing instructions to all device type prompts
  - Create injectEpilepsySafety function for prompt enhancement
  - _Requirements: 5.1_

- [ ] 7.2 Add UI-level epilepsy safety controls
  - Update all animation components to respect epilepsy mode
  - Implement smooth transitions instead of rapid changes
  - Add visual frequency monitoring (< 3 Hz)
  - Update device tiles and ghost animations for safety compliance
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [ ] 7.3 Write property tests for epilepsy safety
  - **Property 20: Anti-flashing prompt injection**
  - **Property 24: Visual frequency limits**
  - **Validates: Requirements 5.1, 5.5**

- [ ] 8. Integrate enhanced features with existing system
- [ ] 8.1 Update existing API endpoints for enhanced fields
  - Modify GET /devices to return enhanced device fields
  - Update device creation to generate default prompts
  - Ensure backward compatibility with existing device data
  - _Requirements: 9.2, 10.1-10.4_

- [ ] 8.2 Add real-time updates for enhanced features
  - Implement WebSocket events for device toggle changes
  - Add real-time settings updates during active haunting
  - Create device action event broadcasting
  - Update frontend to handle real-time enhanced events
  - _Requirements: 1.5, 8.4_

- [ ] 8.3 Update existing components for enhanced features
  - Modify existing device setup flow to include frequency and prompt configuration
  - Update haunting start/stop to handle scene setup phase
  - Ensure all existing functionality works with enhanced device model
  - _Requirements: 3.1, 9.1_

- [ ] 8.4 Write integration tests for enhanced system
  - **Property 5: Live toggle updates**
  - **Property 48: Custom prompt usage priority**
  - **Property 49: Default prompt fallback**
  - **Validates: Requirements 1.5, 10.7, 10.8**

- [ ] 9. Checkpoint - Ensure all tests pass and features work together
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Deploy and test enhanced application
- [ ] 10.1 Deploy enhanced backend
  - Build updated TypeScript code with enhanced models and services
  - Update CDK stack with new Lambda handlers and DynamoDB schema changes
  - Deploy enhanced backend with all new endpoints
  - Test all enhanced API endpoints
  - _Requirements: All backend requirements_

- [ ] 10.2 Deploy enhanced frontend
  - Build Vue app with enhanced components and features
  - Update environment variables for enhanced API endpoints
  - Deploy to S3 and update CloudFront distribution
  - Test enhanced UI features in production
  - _Requirements: All frontend requirements_

- [ ] 10.3 End-to-end testing of enhanced features
  - Test complete enhanced device management workflow
  - Verify scene setup and random trigger phases work correctly
  - Test orchestrator settings and live configuration updates
  - Validate ghost animations and device tile interactions
  - Test epilepsy safety controls across all features
  - Verify frequency weighting works as expected over multiple sessions
  - _Requirements: All requirements_