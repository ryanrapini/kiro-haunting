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

- [ ] 8. Create sub-agent system prompts
  - Write Lights Sub-Agent prompt (generates voice commands for lights)
  - Write Audio Sub-Agent prompt (generates voice commands for speakers)
  - Write TV Sub-Agent prompt (generates voice commands for TVs)
  - Write Smart Plug Sub-Agent prompt (generates voice commands for plugs)
  - Include platform-specific command format (Alexa vs Google)
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 9. Create haunting orchestrator backend
  - Create Lambda function for agent orchestration
  - Implement haunting session creation in DynamoDB
  - Group devices by type and call OpenAI with sub-agent prompts
  - Build command queue with randomized order
  - Store session with command queue in DynamoDB
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 10. Implement haunting control endpoints
  - Create Lambda for start haunting (POST /haunting/start)
  - Create Lambda for stop haunting (POST /haunting/stop)
  - Create Lambda for get next command (GET /haunting/command)
  - Mark commands as spoken and trigger regeneration when queue is low
  - _Requirements: 4.3, 5.5, 11.2_

- [ ] 11. Create API client service and integrate frontend
  - Create centralized API client in frontend/src/services/api.ts
  - Implement all API endpoints (auth, config, devices, haunting)
  - Replace mock data in all components with real API calls
  - Add error handling and loading states
  - Test complete user flow
  - _Requirements: All API-related requirements_

- [ ] 12. Set up custom domain and SSL
  - Configure Route 53 hosted zone for kiro-haunting.me
  - Request SSL certificate via AWS Certificate Manager
  - Set up CloudFront distribution for frontend
  - Create Route 53 A record pointing to CloudFront
  - Update API Gateway with custom domain (api.kiro-haunting.me)
  - _Requirements: MVP infrastructure_

- [ ] 13. Deploy backend to AWS
  - Build backend TypeScript code
  - Package Lambda functions with dependencies
  - Store OpenAI API key in SSM Parameter Store
  - Deploy CDK stack with actual Lambda implementations
  - Test all API endpoints
  - _Requirements: MVP infrastructure_

- [ ] 14. Deploy frontend to AWS
  - Build Vue app for production
  - Upload build artifacts to S3 bucket
  - Configure CloudFront distribution
  - Test application at kiro-haunting.me
  - Verify complete user flow in production
  - _Requirements: MVP infrastructure_

- [ ] 15. End-to-end testing and polish
  - Test complete user flow from registration to haunting
  - Test with actual Alexa or Google Home devices
  - Verify voice commands work correctly
  - Test with multiple device types
  - Fix any bugs or issues
  - _Requirements: All requirements_

- [ ] 16. Documentation
  - Update README with setup instructions
  - Document environment variables
  - Create demo video showing full flow
  - Document known limitations
  - _Requirements: Hackathon submission requirements_
