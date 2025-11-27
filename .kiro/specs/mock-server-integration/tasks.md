# Implementation Plan

- [x] 1. Set up mock server infrastructure

  - Create MockServerManager class with port allocation, process spawning, and state management
  - Implement findAvailablePort method to scan ports 4010-4099
  - Implement spawnPrismProcess method using Node.js child_process
  - Add process monitoring with crash detection
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1_

- [x] 2. Create mock server API routes
- [x] 2.1 Implement /api/mock/start endpoint

  - Accept specId and OpenAPI spec in request body
  - Write spec to temp file in /tmp/splice-specs/
  - Call MockServerManager.startServer()
  - Return server URL, port, and status
  - Handle errors for invalid specs and port conflicts
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.3_

- [x] 2.2 Implement /api/mock/stop endpoint

  - Accept specId in request body
  - Call MockServerManager.stopServer()
  - Clean up temp spec file
  - Return success status
  - _Requirements: 2.5_

- [x] 2.3 Implement /api/mock/status endpoint

  - Accept specId as query parameter
  - Query MockServerManager for server info
  - Return current status, URL, and port
  - _Requirements: 2.1_

- [x] 3. Build mock server UI controls
- [x] 3.1 Create MockServerControls component

  - Display server status badge (Running/Stopped/Starting)
  - Show server URL as clickable link when running
  - Add Start/Stop buttons with loading states
  - Display error messages when operations fail
  - Poll /api/mock/status for real-time updates
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.2_

- [x] 3.2 Create MockServerContext for global state

  - Implement context provider with mock mode state
  - Add mockServerInfo state for current server
  - Provide useMockServer hook for components
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Integrate mock mode toggle in request builder
- [x] 4.1 Add mock mode toggle control

  - Add Switch component to RequestBuilder
  - Connect to MockServerContext
  - Disable toggle when mock server is not running
  - Show warning message when mock mode selected but server stopped
  - _Requirements: 3.1, 3.5_

- [x] 4.2 Update request preview to show target URL

  - Display mock server URL when mock mode enabled
  - Display real API URL when mock mode disabled
  - Add visual indicator for current mode
  - _Requirements: 3.4_

- [x] 5. Enhance request proxy for mock routing

  - Update /api/proxy/route.ts to accept useMock and mockServerUrl parameters
  - Implement URL replacement logic to route to mock server
  - Preserve path, query parameters, and headers
  - Handle mock server connection errors
  - _Requirements: 3.2, 3.3, 5.5_

- [x] 6. Implement automatic mock server startup
- [x] 6.1 Add auto-start on spec upload

  - Trigger mock server start after successful spec upload
  - Display notification with mock server URL
  - Handle auto-start failures with retry option
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6.2 Add auto-start settings toggle

  - Create settings context for user preferences
  - Add toggle to enable/disable auto-start
  - Persist preference in localStorage
  - _Requirements: 4.4_

- [x] 6.3 Display mock server status on explorer page

  - Show MockServerControls component in explorer layout
  - Update status when navigating to explorer
  - _Requirements: 4.5_

- [x] 7. Implement comprehensive error handling
- [x] 7.1 Add Prism installation detection

  - Check if Prism CLI is available on system
  - Display installation instructions if not found
  - Provide link to Prism documentation
  - _Requirements: 5.4_

- [x] 7.2 Handle port conflicts gracefully

  - Detect EADDRINUSE errors
  - Automatically retry with next available port
  - Display error if no ports available after 10 attempts
  - _Requirements: 5.3_

- [x] 7.3 Add process crash recovery

  - Monitor Prism process exit events
  - Update server status to "Stopped" on crash
  - Log crash details for debugging
  - _Requirements: 5.1, 5.2_

- [x] 8. Add testing and polish
- [x] 8.1 Write unit tests for MockServerManager

  - Test port allocation logic
  - Test process spawning (mocked)
  - Test state management
  - Test error scenarios
  - _Requirements: All_

- [x] 8.2 Write integration tests for mock server lifecycle

  - Test full start/stop cycle
  - Test request routing to mock server
  - Test error recovery flows
  - _Requirements: All_

- [x] 8.3 Perform manual testing with multiple specs
  - Test with Petstore spec
  - Test with Stripe spec
  - Test with invalid specs
  - Test concurrent mock servers
  - _Requirements: All_
