# Implementation Plan: Haunted Home Orchestrator MVP

This implementation plan focuses on delivering Simple Mode first - a working haunted house experience that generates voice commands spoken through the browser. The plan builds incrementally, with each task creating testable functionality.

## Tasks

- [x] 1. Set up AWS infrastructure and project foundation
  - Create AWS account and configure CLI credentials
  - Set up DynamoDB tables (UserConfig, Devices, HauntingSessions)
  - Configure AWS Cognito User Pool for authentication
  - Set up Route 53 hosted zone for kiro-haunting.me domain
  - Request SSL certificate via AWS Certificate Manager
  - Create basic project structure for frontend and backend
  - _Requirements: MVP infrastructure setup_

- [ ] 2. Implement backend authentication system
  - Create Lambda function for user registration (POST /auth/register)
  - Create Lambda function for user login (POST /auth/login)
  - Implement Cognito SDK integration for user creation and authentication
  - Return JWT tokens on successful login
  - Add error handling for invalid credentials and existing users
  - _Requirements: 1.1, 1.3_

- [ ]* 2.1 Write property test for credential storage
  - **Property 2: Credential storage on success**
  - **Validates: Requirements 1.3**

- [ ] 3. Build frontend authentication UI
  - Create LoginPage component with email/password fields
  - Create RegisterPage component with email/password fields
  - Add client-side form validation (email format, password requirements)
  - Create API client service for authentication endpoints
  - Implement authentication state management (store JWT tokens)
  - Add loading states and error message display
  - Add navigation between login and register pages
  - _Requirements: 1.1, 1.3, 1.4_

- [ ]* 3.1 Write unit tests for form validation
  - Test email validation
  - Test password requirements
  - Test error message display
  - _Requirements: 1.1, 1.4_

- [ ] 4. Implement user configuration management backend
  - Create Lambda function to save user config (POST /config)
  - Create Lambda function to retrieve user config (GET /config)
  - Implement DynamoDB operations for UserConfig table
  - Store platform (alexa/google) and mode (simple only for MVP)
  - Add error handling for missing or invalid configurations
  - _Requirements: 1.1, 1.2_

- [ ]* 4.1 Write property test for configuration persistence
  - **Property 7: Device selection persistence**
  - **Validates: Requirements 3.3**

- [ ] 5. Build platform and mode selection UI
  - Create SetupWizardPage component
  - Add platform selector with radio buttons (Alexa/Google)
  - Add mode display showing "Simple Mode" (Connected mode disabled for MVP)
  - Save platform selection to backend via API
  - Add "Continue to Device Setup" button
  - Implement navigation to device setup page
  - _Requirements: 1.1, 1.2, 1.5_

- [ ] 6. Implement device setup AI agent backend
  - Create OpenAI integration utility module
  - Write device setup agent system prompt (conversational device collection)
  - Create Lambda function for device chat endpoint (POST /devices/chat)
  - Implement conversation state management (pass history in request)
  - Parse agent responses for DEVICE_READY signals
  - Extract device details (type, name, formalName, commandExamples) from agent response
  - Save devices to DynamoDB Devices table when agent confirms readiness
  - Return chat response and created device to frontend
  - _Requirements: 2.6_

- [ ]* 6.1 Write property test for device categorization
  - **Property 5: Device categorization consistency**
  - **Validates: Requirements 2.2**

- [ ] 7. Build device setup chat interface
  - Create DeviceSetupPage component with chat UI
  - Add message history display (user and agent messages)
  - Add text input field for user messages
  - Implement send message functionality calling /devices/chat endpoint
  - Display device list showing all added devices with type icons
  - Add delete button for each device (calls DELETE /devices/:deviceId)
  - Show "Start Haunting" button when at least 1 device exists
  - Add loading indicator while agent is responding
  - _Requirements: 2.6, 3.1, 3.2, 3.3, 3.4_

- [ ]* 7.1 Write unit tests for chat UI
  - Test message rendering
  - Test device list updates
  - Test delete functionality
  - _Requirements: 3.1, 3.2_

- [ ] 8. Create sub-agent system prompts
  - Write Lights Sub-Agent prompt for Simple Mode (generates voice commands for lights)
  - Write Audio Sub-Agent prompt for Simple Mode (generates voice commands for speakers)
  - Write TV Sub-Agent prompt for Simple Mode (generates voice commands for TVs)
  - Write Smart Plug Sub-Agent prompt for Simple Mode (generates voice commands for plugs)
  - Store prompts as constants in backend code
  - Include platform-specific command format (Alexa vs Google)
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 9. Create haunting orchestrator Lambda
  - Create Lambda function for agent orchestration (invoked by start haunting)
  - Implement haunting session creation in DynamoDB
  - Group user's devices by device type
  - For each device type with devices, call OpenAI API with corresponding sub-agent prompt
  - Parse AI responses to extract voice commands (JSON array)
  - Build command queue with randomized order
  - Store session with command queue in DynamoDB HauntingSessions table
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 9.1 Write property test for sub-agent spawning
  - **Property 8: Sub-agent spawning completeness**
  - **Validates: Requirements 5.1**

- [ ]* 9.2 Write property test for device assignment
  - **Property 9: Device assignment correctness**
  - **Validates: Requirements 5.2**

- [ ] 10. Implement haunting control endpoints
  - Create Lambda function for start haunting (POST /haunting/start)
  - Invoke orchestrator Lambda to generate initial commands
  - Create Lambda function for stop haunting (POST /haunting/stop)
  - Mark session as inactive and clear command queue
  - Create Lambda function for get next command (GET /haunting/command)
  - Return next unspoken command from queue
  - Mark command as spoken in DynamoDB
  - Trigger command regeneration when queue has fewer than 5 commands
  - _Requirements: 4.3, 5.5, 11.2_

- [ ]* 10.1 Write property test for duplicate trigger handling
  - **Property 11: Duplicate trigger idempotence**
  - **Validates: Requirements 4.4**

- [ ]* 10.2 Write property test for agent termination
  - **Property 12: Agent termination completeness**
  - **Validates: Requirements 11.2**

- [ ] 11. Build haunting control UI
  - Create HauntingControlPage component
  - Add "Stop Haunting" button with prominent styling
  - Implement command polling (GET /haunting/command every 2-5 seconds with random delay)
  - Integrate Web Speech API for text-to-speech
  - Speak command text aloud when received
  - Display last spoken command on screen
  - Add visual indicator showing haunting is active (animated ghost icon)
  - Handle stop haunting action (call POST /haunting/stop)
  - Navigate back to device setup after stopping
  - _Requirements: 10.1, 10.2, 11.1, 11.2_

- [ ]* 11.1 Write unit tests for command polling
  - Test polling interval randomization
  - Test command retrieval
  - Test stop functionality
  - _Requirements: 10.2, 11.1, 11.2_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Add Halloween theming to UI
  - TailwindCSS theme with dark colors, orange and purple accents already configured
  - Spooky fonts can be added via Google Fonts if needed
  - Add ghost icons and haunted house imagery to components
  - Apply Halloween theme to all pages
  - Ensure readability and usability
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 14. Implement error handling and edge cases
  - Add try-catch blocks and error responses in all Lambda functions
  - Handle empty device lists in frontend (show helpful message)
  - Handle authentication errors with retry option in UI
  - Add loading states to all async operations in UI
  - Handle text-to-speech failures gracefully (log error, continue to next command)
  - Display user-friendly error messages throughout UI
  - _Requirements: 1.4, 2.5_

- [ ]* 14.1 Write property test for authentication error handling
  - **Property 3: Authentication error handling**
  - **Validates: Requirements 1.4**

- [ ] 15. Update CDK stack for production deployment
  - Uncomment CloudFront distribution configuration
  - Uncomment Route 53 records for kiro-haunting.me
  - Uncomment certificate configuration
  - Replace placeholder Lambda with actual Lambda functions from backend/
  - Configure Lambda function code from backend/dist/
  - Add separate Lambda functions for each endpoint
  - Update API Gateway to use actual Lambda functions
  - _Requirements: MVP infrastructure_

- [ ] 16. Deploy backend to AWS
  - Build backend TypeScript code (npm run build)
  - Package Lambda functions with dependencies
  - Store OpenAI API key in SSM Parameter Store
  - Deploy CDK stack (cdk deploy)
  - Verify all Lambda functions are deployed
  - Test all API endpoints using CDK outputs
  - _Requirements: MVP infrastructure_

- [ ] 17. Deploy frontend to AWS
  - Create .env file with CDK output values (API endpoint, Cognito IDs)
  - Build React app for production (npm run build)
  - Upload build artifacts to S3 bucket
  - Invalidate CloudFront cache
  - Test application at kiro-haunting.me
  - Verify HTTPS works correctly
  - Test complete user flow in production
  - _Requirements: MVP infrastructure_

- [ ] 18. End-to-end manual testing
  - Test complete user flow from registration to haunting
  - Test with actual Alexa or Google Home devices
  - Verify voice commands are spoken clearly by browser
  - Verify devices respond correctly to spoken commands
  - Test with multiple device types (lights, speakers, TV, plugs)
  - Verify random delays work as expected
  - Test error scenarios (no devices, network failures)
  - _Requirements: All requirements_

- [ ] 19. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Documentation and polish
  - Update README with complete setup instructions
  - Document all environment variables needed
  - Add inline code comments to complex logic
  - Create demo video (3 minutes) showing full flow
  - Write Kiro usage documentation for hackathon submission
  - Document known limitations and future enhancements
  - _Requirements: Hackathon submission requirements_
