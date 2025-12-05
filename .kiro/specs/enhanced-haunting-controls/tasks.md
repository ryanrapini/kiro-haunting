# Implementation Plan: Enhanced Haunting Controls MVP

Streamlined MVP implementation plan for shipping in 30 minutes. Focus on core functionality only - no tests, minimal features.

## Tasks

- [x] 1. Add epilepsy mode placeholder to settings
- [x] 1.1 Update SettingsPage component
  - Add epilepsy mode toggle to frontend/src/views/SettingsPage.vue
  - Display "Coming Soon" text instead of functional toggle
  - Keep toggle disabled but visible for future implementation
  - _Requirements: 8.1_

- [x] 2. Fix any critical bugs preventing haunting from working
- [x] 2.1 Verify device setup flow works
  - Test adding devices through chat interface
  - Ensure devices can be enabled/disabled
  - Verify haunting starts with enabled devices
  - _Requirements: 1.1, 1.2_

- [x] 2.2 Fix any API or UI errors
  - Check browser console for JavaScript errors
  - Verify all API endpoints respond correctly
  - Fix any broken navigation or UI components
  - _Requirements: All core functionality_

- [x] 3. Deploy working application
- [x] 3.1 Build and deploy backend
  - Build TypeScript code: `bun run build` in backend/
  - Deploy infrastructure: `bun run deploy` in infrastructure/
  - _Requirements: Backend deployment_

- [x] 3.2 Build and deploy frontend
  - Build Vue app: `bun run build` in frontend/
  - Deploy to S3 and invalidate CloudFront cache
  - _Requirements: Frontend deployment_

- [x] 3.3 Test end-to-end functionality
  - Add at least one device through the UI
  - Enable the device
  - Start haunting and verify commands are generated
  - Confirm speech synthesis works
  - _Requirements: Complete user workflow_