# Implementation Plan: Haunted Home Orchestrator MVP

This implementation plan focuses on delivering Simple Mode first - a working haunted house experience that generates voice commands spoken through the browser. The plan builds incrementally, with each task creating testable functionality.

## Tasks

- [-] 1. Set up AWS infrastructure and project foundation
  - Create AWS account and configure CLI credentials
  - Set up DynamoDB tables (UserConfig, Devices, HauntingSessions)
  - Configure AWS Cognito User Pool for authentication
  - Set up Route 53 hosted zone for kiro-haunting.me domain
  - Request SSL certificate via AWS Certificate Manager
  - Create basic project structure for frontend and backend
  - _Requirements: MVP infrastructure setup_

- [ ] 2. Implement backend authentication system
  - Create Lambda function for user registration
  - Create Lambda function for user login
  - Set up API Gateway with Cognito authorizer
  - Configure CORS for API Gateway
  - Test authentication flow with Postman
  - _Requirements: 1.1, 1.3_

- [ ]* 2.1 Write property test for credential storage
  - **Property 2: Credential storage on success**
  - **Validates: Requirements 1.3**

- [ ] 3. Build frontend authentication UI
  - Create React app with Vite and TypeScript
  - Implement login page component
  - Implement registration page component
  - Add form validation
  - Connect to backend auth APIs
  - Add loading states and error handling
  - _Requirements: 1.1, 1.3, 1.4_

- [ ]* 3.1 Write unit tests for form validation
  - Test email validation
  - Test password requirements
  - Test error message display
  - _Requirements: 1.1, 1.4_

- [ ] 4. Implement user configuration management
  - Create Lambda function to save user config (platform, mode)
  - Create Lambda function to retrieve user config
  - Add DynamoDB operations for UserConfig table
  - Test config persistence
  - _Requirements: 1.1, 1.2_

- [ ]* 4.1 Write property test for configuration persistence
  - **Property 7: Device selection persistence**
  - **Validates: Requirements 3.3**

- [ ] 5. Build platform and mode selection UI
  - Create setup wizard component
  - Add platform selector (Alexa/Google radio buttons)
  - Add mode selector (Simple/Connected, Simple only for MVP)
  - Save selections to backend
  - Add navigation to device setup
  - _Requirements: 1.1, 1.2, 1.5_

- [ ] 6. Implement device setup AI agent
  - Create OpenAI integration utility
  - Write device setup agent system prompt
  - Create Lambda function for device chat endpoint
  - Implement conversation state management
  - Parse agent responses for device creation
  - Save devices to DynamoDB when agent confirms readiness
  - _Requirements: 2.6_

- [ ]* 6.1 Write property test for device categorization
  - **Property 5: Device categorization consistency**
  - **Validates: Requirements 2.2**

- [ ] 7. Build device setup chat interface
  - Create chat UI component with message history
  - Add input field for user messages
  - Display agent responses
  - Show device list as devices are added
  - Add delete device functionality
  - Show "Start Haunting" button when ≥1 device exists
  - _Requirements: 2.6, 3.1, 3.2, 3.3, 3.4_

- [ ]* 7.1 Write unit tests for chat UI
  - Test message rendering
  - Test device list updates
  - Test delete functionality
  - _Requirements: 3.1, 3.2_

- [ ] 8. Implement sub-agent system prompts
  - Write Lights Sub-Agent prompt for Simple Mode
  - Write Audio Sub-Agent prompt for Simple Mode
  - Write TV Sub-Agent prompt for Simple Mode
  - Write Smart Plug Sub-Agent prompt for Simple Mode
  - Store prompts in configuration
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 9. Create haunting orchestrator Lambda
  - Implement haunting session creation
  - Group devices by type
  - Call OpenAI API for each device type with sub-agent prompt
  - Parse AI responses to extract voice commands
  - Build command queue with randomized order
  - Store session and commands in DynamoDB
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 9.1 Write property test for sub-agent spawning
  - **Property 8: Sub-agent spawning completeness**
  - **Validates: Requirements 5.1**

- [ ]* 9.2 Write property test for device assignment
  - **Property 9: Device assignment correctness**
  - **Validates: Requirements 5.2**

- [ ] 10. Implement haunting control endpoints
  - Create Lambda function for start haunting
  - Create Lambda function for stop haunting
  - Create Lambda function for get next command
  - Mark commands as spoken when retrieved
  - Trigger command regeneration when queue is low
  - _Requirements: 4.3, 5.5, 11.2_

- [ ]* 10.1 Write property test for duplicate trigger handling
  - **Property 11: Duplicate trigger idempotence**
  - **Validates: Requirements 4.4**

- [ ]* 10.2 Write property test for agent termination
  - **Property 12: Agent termination completeness**
  - **Validates: Requirements 11.2**

- [ ] 11. Build haunting control UI
  - Create haunting control page component
  - Add "Stop Haunting" button
  - Implement command polling (every 2-5 seconds with random delay)
  - Integrate Web Speech API for text-to-speech
  - Display last spoken command
  - Add visual indicator for active haunting
  - Handle stop haunting action
  - _Requirements: 10.1, 10.2, 11.1, 11.2_

- [ ]* 11.1 Write unit tests for command polling
  - Test polling interval randomization
  - Test command retrieval
  - Test stop functionality
  - _Requirements: 10.2, 11.1, 11.2_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Add Halloween theming to UI
  - Create TailwindCSS theme with dark colors, orange and purple accents
  - Add spooky fonts (e.g., Creepster, Nosifer from Google Fonts)
  - Add ghost icons and haunted house imagery
  - Style all pages with Halloween theme
  - Add subtle animations (optional, using Framer Motion)
  - Ensure readability and usability
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 14. Implement error handling and edge cases
  - Add error handling for failed API calls
  - Handle empty device lists
  - Handle authentication errors with retry
  - Add loading states throughout UI
  - Handle text-to-speech failures gracefully
  - Display user-friendly error messages
  - _Requirements: 1.4, 2.5_

- [ ]* 14.1 Write property test for authentication error handling
  - **Property 3: Authentication error handling**
  - **Validates: Requirements 1.4**

- [ ] 15. Set up frontend hosting on AWS
  - Create S3 bucket for static hosting
  - Configure bucket for website hosting
  - Create CloudFront distribution
  - Configure custom domain with Route 53
  - Set up SSL certificate
  - Configure error pages for SPA routing
  - _Requirements: MVP infrastructure_

- [ ] 16. Deploy backend to AWS
  - Package Lambda functions
  - Deploy Lambda functions to AWS
  - Configure environment variables (Cognito IDs, OpenAI API key)
  - Set up IAM roles and permissions
  - Deploy API Gateway
  - Configure custom domain for API (api.kiro-haunting.me)
  - Test all endpoints in production
  - _Requirements: MVP infrastructure_

- [ ] 17. Deploy frontend to AWS
  - Build React app for production
  - Upload build to S3 bucket
  - Invalidate CloudFront cache
  - Test application at kiro-haunting.me
  - Verify HTTPS works correctly
  - _Requirements: MVP infrastructure_

- [ ] 18. End-to-end testing with real devices
  - Test complete user flow from registration to haunting
  - Test with actual Alexa or Google Home devices
  - Verify voice commands are spoken clearly
  - Verify devices respond to spoken commands
  - Test with multiple device types
  - Verify random delays work as expected
  - _Requirements: All requirements_

- [ ] 19. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Documentation and polish
  - Write README with setup instructions
  - Document environment variables needed
  - Add inline code comments
  - Create demo video (3 minutes)
  - Write Kiro usage documentation for hackathon submission
  - _Requirements: Hackathon submission requirements_
