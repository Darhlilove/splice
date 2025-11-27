# Requirements Document

## Introduction

This feature enables developers to automatically generate and control mock API servers from OpenAPI specifications using Prism. The mock server integration allows developers to test API interactions without requiring a live backend, providing realistic mock responses based on the OpenAPI schema. This feature includes server lifecycle management (start/stop), UI controls, and the ability to toggle between real and mock endpoints during API exploration.

## Glossary

- **Mock Server**: A simulated API server that generates responses based on OpenAPI specification examples and schemas
- **Prism**: The Stoplight Prism CLI tool used to generate mock servers from OpenAPI specifications
- **Server Manager**: The backend module responsible for managing mock server lifecycle
- **Mock Controls Component**: The UI component that displays server status and provides start/stop controls
- **Request Proxy**: The API route that forwards requests to either real or mock endpoints based on user selection

## Requirements

### Requirement 1

**User Story:** As a developer, I want to automatically start a mock server from my OpenAPI spec, so that I can test API interactions without a live backend

#### Acceptance Criteria

1. WHEN the System receives an OpenAPI specification, THE Server Manager SHALL validate the specification format before attempting to start a mock server
2. WHEN the Server Manager starts a mock server, THE Server Manager SHALL allocate an available port between 4010 and 4099
3. WHEN the mock server starts successfully, THE Server Manager SHALL return the server URL and port number within 5 seconds
4. IF the mock server fails to start, THEN THE Server Manager SHALL return an error message indicating the specific failure reason
5. WHILE the mock server is running, THE Server Manager SHALL maintain the server process and monitor its health status

### Requirement 2

**User Story:** As a developer, I want to control the mock server through a UI, so that I can easily start and stop it as needed

#### Acceptance Criteria

1. THE Mock Controls Component SHALL display the current server status as either "Running", "Stopped", or "Starting"
2. WHEN the mock server is stopped, THE Mock Controls Component SHALL display a "Start Mock Server" button
3. WHEN the mock server is running, THE Mock Controls Component SHALL display the server URL as a clickable link and a "Stop Mock Server" button
4. WHEN the user clicks the start button, THE Mock Controls Component SHALL show a loading indicator until the server starts or fails
5. WHEN the user clicks the stop button, THE Server Manager SHALL terminate the mock server process within 2 seconds

### Requirement 3

**User Story:** As a developer, I want to toggle between real API and mock server endpoints, so that I can compare responses and test different scenarios

#### Acceptance Criteria

1. THE Request Builder SHALL display a toggle control labeled "Use Mock Server" and "Use Real API"
2. WHEN the toggle is set to "Use Mock Server", THE Request Proxy SHALL route all requests to the mock server URL
3. WHEN the toggle is set to "Use Real API", THE Request Proxy SHALL route all requests to the original API base URL from the OpenAPI specification
4. THE Request Preview Component SHALL display the target URL showing whether the request will hit the mock or real endpoint
5. WHEN the mock server is not running and the user selects "Use Mock Server", THE System SHALL display a warning message and disable the execute button

### Requirement 4

**User Story:** As a developer, I want the mock server to automatically start when I upload a spec, so that I can immediately begin testing

#### Acceptance Criteria

1. WHEN a user uploads a new OpenAPI specification, THE System SHALL automatically initiate mock server startup
2. WHEN the automatic startup completes, THE System SHALL display a notification showing the mock server URL
3. IF the automatic startup fails, THEN THE System SHALL display an error notification with a retry option
4. THE System SHALL allow users to disable automatic startup through a settings toggle
5. WHEN navigating to the explorer page, THE Mock Controls Component SHALL display the current mock server status

### Requirement 5

**User Story:** As a developer, I want the system to handle mock server errors gracefully, so that I can recover from failures without restarting the application

#### Acceptance Criteria

1. IF the mock server process crashes, THEN THE Server Manager SHALL detect the crash within 5 seconds and update the status to "Stopped"
2. WHEN a mock server error occurs, THE System SHALL log the error details for debugging purposes
3. WHEN the user attempts to start a mock server on an occupied port, THE Server Manager SHALL automatically select the next available port
4. IF Prism CLI is not installed, THEN THE System SHALL display installation instructions with a link to the Prism documentation
5. WHEN the mock server returns an error response, THE Response Viewer SHALL display the error with appropriate formatting
