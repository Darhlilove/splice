# Implementation Plan

- [x] 1. Set up CORS proxy API route

  - Create `/app/api/proxy/route.ts` with POST handler
  - Implement request validation (URL format, method, headers)
  - Use axios to make server-side HTTP requests with timeout handling
  - Capture response time using performance timing
  - Return structured response with status, headers, body, and timing
  - Add error handling for network errors, timeouts, and invalid requests
  - _Requirements: 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2_

- [x] 2. Create request state management

  - Create `app/lib/requestState.ts` with RequestStateManager class
  - Implement state properties: loading, response, error, validationResult
  - Add methods: setLoading, setResponse, setError, setValidationResult, reset
  - Export React hook useRequestState for component integration
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Build Execute Button component

  - [x] 3.1 Create ExecuteButton component with props interface

    - Create `app/components/ExecuteButton.tsx`
    - Define ExecuteButtonProps interface with endpoint, parameters, auth, body
    - Implement parameter validation logic for required fields
    - Add loading state management with spinner display
    - Disable button during execution to prevent duplicate requests
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.2 Implement request execution logic

    - Build request payload from parameters, auth, and body
    - Call /api/proxy with constructed request
    - Handle successful response with onExecute callback
    - Handle errors with onError callback and user-friendly messages
    - _Requirements: 1.4, 1.5, 7.5_

  - [x] 3.3 Add validation error display
    - Show validation errors for missing required parameters
    - Highlight invalid parameter formats
    - Display specific error messages per field
    - _Requirements: 7.5_

- [x] 4. Create Response Viewer component

  - [x] 4.1 Build base ResponseViewer component

    - Create `app/components/ResponseViewer.tsx`
    - Define APIResponse and RequestError interfaces
    - Implement status code display with color coding (2xx=green, 4xx=orange, 5xx=red)
    - Display response time in milliseconds
    - Show loading state during request execution
    - _Requirements: 2.1, 2.2_

  - [x] 4.2 Add response headers section

    - Create collapsible headers section using HeroUI Collapse
    - Display all response headers in key-value format
    - Format header names and values for readability
    - _Requirements: 2.5_

  - [x] 4.3 Implement response body display with syntax highlighting

    - Integrate react-syntax-highlighter for code display
    - Detect content type from response headers
    - Apply JSON syntax highlighting for application/json
    - Apply XML/HTML highlighting for text/xml and text/html
    - Handle plain text responses
    - _Requirements: 2.3, 2.4_

  - [x] 4.4 Add error display
    - Show error type icon based on error category
    - Display error message prominently with styling
    - Create collapsible section for error details
    - Add Retry button that re-executes the request
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 5. Build Response Formatter component

  - [x] 5.1 Create ResponseFormatter with format controls

    - Create `app/components/ResponseFormatter.tsx`
    - Add Pretty Print button for JSON formatting with indentation
    - Add Minify button for single-line JSON
    - Implement format state management
    - _Requirements: 3.1, 3.2_

  - [x] 5.2 Implement copy to clipboard functionality

    - Add Copy button with clipboard API integration
    - Show confirmation toast notification on successful copy
    - Handle clipboard errors gracefully
    - _Requirements: 3.3, 3.5_

  - [x] 5.3 Implement download functionality
    - Add Download button that triggers file download
    - Determine file extension based on content type (json, xml, html, txt)
    - Generate filename with timestamp
    - Create blob and trigger browser download
    - Show confirmation message after download
    - _Requirements: 3.4, 3.5_

- [x] 6. Create Schema Validator component

  - [x] 6.1 Build schema validation utility

    - Create `app/lib/schemaValidator.ts` with SchemaValidator class
    - Implement validate method that compares response to OpenAPI schema
    - Use ajv library for JSON schema validation
    - Identify matching fields, extra fields, and missing required fields
    - Return ValidationResult with categorized fields and errors
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 6.2 Create SchemaValidator UI component
    - Create `app/components/SchemaValidator.tsx`
    - Display validation summary (valid/invalid status)
    - Show matching fields with green highlighting
    - Show extra fields with yellow highlighting
    - Show missing required fields with red highlighting
    - Display field-by-field comparison with expected vs actual types
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 7. Implement request history system

  - [x] 7.1 Create history store

    - Create `app/lib/historyStore.ts` with HistoryStore class
    - Implement addEntry method with max 10 entries limit
    - Implement getEntries, getEntry, clearHistory methods
    - Add exportHistory method that returns JSON string
    - Use sessionStorage for persistence across page navigations
    - _Requirements: 6.1, 6.2, 6.5_

  - [x] 7.2 Build HistorySidebar component

    - Create `app/components/HistorySidebar.tsx`
    - Display list of last 10 requests with timestamp, method, endpoint, status
    - Format timestamps as relative time (e.g., "2 min ago")
    - Make entries clickable to view stored response
    - Add Clear History button
    - Add Export History button
    - _Requirements: 6.3, 6.4_

  - [x] 7.3 Integrate history with request execution
    - Store request/response in history after each execution
    - Update history display in real-time
    - Handle history entry selection to display previous response
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 8. Integrate components into explorer page

  - [x] 8.1 Update explorer page layout

    - Import and add ExecuteButton to request builder section
    - Add ResponseViewer below request builder
    - Add HistorySidebar to right panel or as collapsible section
    - Wire up component props and callbacks
    - _Requirements: 1.1, 2.1, 6.3_

  - [x] 8.2 Connect with existing request builder

    - Pass parameters from ParameterForm to ExecuteButton
    - Pass authentication config from AuthSection to ExecuteButton
    - Pass request body from RequestBodyEditor to ExecuteButton
    - Use request preview URL for display
    - _Requirements: 1.1, 1.4_

  - [x] 8.3 Add mock server integration
    - Check mock server toggle state from context
    - Route requests to mock server URL when enabled
    - Route requests to real API URL when disabled
    - Display indicator showing which endpoint is being used
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 9. Add comprehensive error handling

  - Implement timeout error handling with configurable timeout (30s default)
  - Add network error detection and user-friendly messages
  - Handle 4xx/5xx responses with status code and error body display
  - Implement retry logic with max 3 retry attempts
  - Add validation error messages for each parameter type
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10. Performance optimization and polish

  - Add React.memo to ResponseViewer to prevent unnecessary re-renders
  - Implement lazy loading for syntax highlighter
  - Add debouncing to format changes (300ms delay)
  - Optimize history store with efficient data structures
  - Add loading skeletons for better perceived performance
  - Test with large response bodies (>1MB) and optimize rendering
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 11. Testing and validation

  - [x] 11.1 Test with real APIs

    - Test GET requests to Petstore API (https://petstore.swagger.io/v2/pet/1)
    - Test POST requests with request body
    - Test PUT and DELETE methods
    - Test with query parameters and headers
    - Test with authentication (API key and Bearer token)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 11.2 Test error scenarios

    - Test with invalid URL format
    - Test with unreachable endpoint (timeout)
    - Test with malformed request body
    - Test with missing required parameters
    - Test network disconnection handling
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 11.3 Test response formatting

    - Test JSON pretty print and minify
    - Test copy to clipboard functionality
    - Test file download with different content types
    - Test syntax highlighting for JSON, XML, HTML
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 11.4 Test schema validation

    - Test with responses that match schema exactly
    - Test with responses containing extra fields
    - Test with responses missing required fields
    - Test with nested object validation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 11.5 Test history functionality
    - Test history entry creation after requests
    - Test history entry selection and display
    - Test history clearing
    - Test history export as JSON
    - Test max 10 entries limit
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
