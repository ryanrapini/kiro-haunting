# Implementation Plan: Haunted Home Orchestrator MVP

This implementation plan focuses on delivering a minimal viable Simple Mode - a working haunted house experience that generates voice commands spoken through the browser.

## Tasks

- [x] 1. Set up AWS infrastructure and project foundation
  - DynamoDB tables created (UserConfig, Devices, HauntingSessions)
  - AWS Cognito User Pool configured
  - Basic project structure for frontend and backend
  - _Requirements: MVP infrastructure setup_

- [x] 2. Build frontend authentication UI
  - LoginPage and RegisterPage components with Cognito integration
  - Form validation and error handling
  - Authentication state management via useAuth composable
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 3. Build platform selection UI
  - SetupPage component with Alexa/Google selector
  - Simple Mode display
  - Navigation to device setup
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 4. Build device setup and haunting UI scaffolding
  - DevicesPage with chat interface and device list (using mock data)
  - HauntingPage with TTS, polling, and controls (using mock data)
  - Halloween theming applied
  - _Requirements: 2.6, 3.1, 3.2, 10.1, 11.1, 13.1-13.5_

- [x] 5. Polish and fix frontend UI
  - Fix PrimeVue integration issues
  - Improve component styling and layout
  - Ensure all pages are fully functional and polished
  - Add proper loading states and transitions
  - Test responsive design
  - _Requirements: 13.1-13.5_

- [x] 6. Implement user configuration backend
  - Create Lambda function to save user config (POST /config)
  - Create Lambda function to retrieve user config (GET /config)
  - Implement DynamoDB operations for UserConfig table
  - _Requirements: 1.1, 1.2_

- [x] 7. Implement device setup AI agent backend
  - Create OpenRouter integration utility module - we will use cheap Claude Haiku 4.5 for all models for now.
  - Write device setup agent system prompt
  - Create Lambda function for device chat endpoint (POST /devices/chat)
  - Parse agent responses and extract device details
  - Save devices to DynamoDB Devices table
  - Create Lambda for device CRUD (GET /devices, DELETE /devices/:id)
  - _Requirements: 2.6, 3.1-3.4_

- [x] 8. Create sub-agent system prompts
  - Write Lights Sub-Agent prompt (generates voice commands for lights)
  - Write Audio Sub-Agent prompt (generates voice commands for speakers)
  - Write TV Sub-Agent prompt (generates voice commands for TVs)
  - Write Smart Plug Sub-Agent prompt (generates voice commands for plugs)
  - Include platform-specific command format (Alexa vs Google)
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 9. Create haunting orchestrator backend
- [x] 9.1 Create haunting session service
  - Implement session creation, retrieval, and update functions in backend/src/services/hauntingService.ts
  - Store sessions in DynamoDB HauntingSessions table
  - Include session state management (active, stopped)
  - _Requirements: 5.1_

- [x] 9.2 Create orchestrator Lambda handler
  - Create backend/src/handlers/haunting.ts with startHaunting, stopHaunting, and getNextCommand handlers
  - Implement device grouping by type (lights, speakers, TVs, smart plugs)
  - Call OpenRouter API with appropriate sub-agent prompts for each device type
  - Parse AI responses to extract voice commands
  - Build randomized command queue from all generated commands
  - Store session with command queue in DynamoDB
  - Export handlers in backend/src/index.ts
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 9.3 Implement command queue management
  - Mark commands as spoken when retrieved via getNextCommand
  - Trigger command regeneration when queue drops below threshold (e.g., 5 commands)
  - Ensure commands are returned in randomized order
  - Handle empty queue scenarios gracefully
  - _Requirements: 5.3, 5.4_

- [ ] 10. Create API client service and integrate frontend
- [x] 10.1 Create centralized API client
  - Create frontend/src/services/api.ts with typed API methods
  - Implement authentication token management
  - Add error handling and retry logic
  - Include methods for: config, devices, haunting endpoints
  - _Requirements: All API-related requirements_

- [x] 10.2 Integrate API client in SetupPage
  - Replace localStorage with API call to save user config
  - Add proper error handling and loading states
  - Test platform selection flow
  - _Requirements: 1.1, 1.2_

- [x] 10.3 Integrate API client in DevicesPage
  - Replace mock data with real API calls to device chat endpoint
  - Implement device list fetching from API
  - Implement device deletion via API
  - Handle conversation history properly
  - Test complete device setup flow
  - _Requirements: 2.6, 3.1-3.4_

- [ ] 10.4 Add device editing functionality
- [ ] 10.4.1 Update Device model and backend
  - Add enabledCapabilities field to Device interface in backend/src/models/types.ts
  - Create DEVICE_CAPABILITIES constant mapping device types to available capabilities
  - Implement updateDevice function in backend/src/services/deviceService.ts
  - Create PUT /devices/:id Lambda handler in backend/src/handlers/devices.ts
  - Validate that at least one capability is selected before saving
  - Export handler in backend/src/index.ts
  - _Requirements: 4.1, 4.4, 4.6_

- [ ] 10.4.2 Add device editing UI
  - Create EditDeviceModal component in frontend/src/components/EditDeviceModal.vue
  - Display device name, formal name, and type-specific capability checkboxes
  - Add edit button to each device card in DevicesPage
  - Implement updateDevice method in frontend/src/services/api.ts
  - Show validation error if no capabilities selected
  - Refresh device list after successful update
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

- [x] 10.5 Integrate API client in HauntingPage
  - Replace mock commands with real API calls to getNextCommand
  - Implement start/stop haunting API calls
  - Handle session state management
  - Test complete haunting flow with TTS
  - _Requirements: 4.3, 5.5, 10.1, 10.2, 11.1, 11.2_

- [ ] 11. Deploy and test complete application
- [x] 11.1 Deploy backend to AWS
  - Build backend TypeScript code
  - Update CDK stack to use real Lambda implementations (not placeholders)
  - Deploy updated stack with all handlers
  - Test all API endpoints via API Gateway
  - _Requirements: MVP infrastructure_

- [ ] 11.2 Deploy frontend to AWS
  - Update frontend environment variables with production API URL
  - Build Vue app for production
  - Upload build artifacts to S3 bucket
  - Configure CloudFront distribution
  - Test application end-to-end in production
  - _Requirements: MVP infrastructure_

- [ ] 11.3 End-to-end testing
  - Test complete user flow from registration to haunting
  - Test with actual Alexa or Google Home devices
  - Verify voice commands work correctly via TTS
  - Test with multiple device types
  - Fix any bugs or issues discovered
  - _Requirements: All requirements_
