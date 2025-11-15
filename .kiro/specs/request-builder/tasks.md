# Implementation Plan

- [x] 1. Set up core infrastructure and types

  - Create TypeScript interfaces for request builder state, parameter values, auth config, and validation errors
  - Create request storage utility module for saving/loading presets and auth credentials in localStorage/sessionStorage
  - _Requirements: 1.1, 1.2, 4.4, 6.3_

- [x] 2. Implement ParameterInput component

  - [x] 2.1 Create base ParameterInput component with input type selection logic

    - Implement logic to determine input component based on schema type (string, number, boolean, enum, array)
    - Create TextInput, NumberInput, CheckboxInput, SelectInput, and ArrayInput sub-components
    - Add required indicator (asterisk) display
    - Add description helper text display
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [x] 2.2 Add validation logic to ParameterInput
    - Implement required field validation
    - Implement type validation (string, number, boolean)
    - Implement pattern validation using regex
    - Implement min/max validation for numbers and string length
    - Implement enum validation
    - Display validation error messages below input
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [-] 3. Implement ParameterForm component

  - [x] 3.1 Create ParameterForm with parameter grouping

    - Group parameters by location (query, path, header, cookie) using Accordion component
    - Render ParameterInput for each parameter in appropriate section
    - Show parameter count badges for each section
    - Set query and path sections to open by default
    - _Requirements: 2.1_

  - [x] 3.2 Implement parameter value change handling
    - Create onChange handler that updates parameter values in state
    - Implement validation on change
    - Store validation errors in state
    - Pass values and errors to ParameterInput components
    - _Requirements: 1.1, 7.1, 7.2_

- [x] 4. Implement RequestBodyEditor component

  - [x] 4.1 Create RequestBodyEditor with content type handling

    - Add content type selector dropdown if multiple content types available
    - Implement conditional rendering based on content type (JSON vs form-data)
    - Add schema viewer showing expected structure
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 4.2 Implement JSON editor with Monaco

    - Integrate Monaco Editor with JSON syntax highlighting
    - Add format/prettify button
    - Implement real-time JSON validation
    - Pre-populate with example value from schema if available
    - _Requirements: 3.2, 3.4_

  - [x] 4.3 Implement form-data editor

    - Generate form input fields based on schema properties
    - Handle file upload inputs for multipart/form-data
    - Validate form fields against schema
    - _Requirements: 3.3_

  - [x] 4.4 Add request body validation
    - Validate JSON syntax
    - Validate against OpenAPI schema
    - Display validation errors
    - _Requirements: 3.5, 7.1_

- [x] 5. Implement AuthenticationSection component

  - [x] 5.1 Create AuthenticationSection with security scheme detection

    - Parse security requirements from endpoint
    - Determine auth type (apiKey, bearer, basic, oauth2)
    - Render appropriate input fields based on auth type
    - Show auth location for API key (header, query, cookie)
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.2 Implement credential persistence
    - Save auth credentials to sessionStorage on change
    - Load saved credentials on component mount
    - Add clear credentials button
    - _Requirements: 4.4_

- [x] 6. Implement RequestPreview component

  - Create RequestPreview component displaying method, URL, headers, and body
  - Build full URL with query parameters appended
  - Replace path parameters in URL with values
  - Include authentication headers in preview
  - Update preview in real-time as user changes inputs (with 300ms debounce)
  - Add copy to clipboard button
  - Add export as cURL command button
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Implement request execution logic

  - [x] 7.1 Create request builder utility

    - Implement buildFinalRequest function that constructs RequestConfig from state
    - Build full URL with query params and path params replaced
    - Construct headers object including auth headers
    - Format request body based on content type
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 7.2 Create API proxy endpoint

    - Create /api/proxy route that accepts method, URL, headers, and body
    - Make server-side HTTP request to avoid CORS issues
    - Return response with appropriate CORS headers
    - Add timeout handling (30s default)
    - Add error handling for network errors
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 7.3 Implement executeRequest function
    - Validate all inputs before execution
    - Show loading spinner during request
    - Call proxy endpoint with request config
    - Measure request duration
    - Handle network errors and timeouts
    - Update response state with result
    - _Requirements: 7.5_

- [x] 8. Implement ResponseViewer component

  - Create ResponseViewer component with status code display
  - Add color-coded status badge (green for 2xx, orange for 4xx, red for 5xx)
  - Display response time in milliseconds
  - Show response headers in collapsible section
  - Display response body with syntax highlighting using react-syntax-highlighter
  - Add pretty print / raw toggle for JSON responses
  - Add copy response button
  - Add download response button
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 9. Implement PresetManager component

  - [x] 9.1 Create PresetManager with save functionality

    - Add "Save as preset" button
    - Show modal/dialog to enter preset name
    - Save current parameter values, request body, and auth to localStorage
    - Use endpoint key (method:path) as storage key
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 9.2 Implement preset loading

    - Display dropdown showing all saved presets for current endpoint
    - Load preset on selection and populate all form fields
    - Show preset creation date
    - _Requirements: 6.4, 6.5_

  - [x] 9.3 Add preset management features
    - Add delete preset button
    - Add export presets as JSON button
    - Add import presets from JSON button
    - _Requirements: 6.3_

- [x] 10. Implement main RequestBuilder component

  - [x] 10.1 Create RequestBuilder component structure

    - Set up component with endpoint and allSchemas props
    - Initialize state for parameters, request body, auth, response, and validation errors
    - Create EndpointHeader showing method, path, summary, and description
    - Render ParameterForm, RequestBodyEditor, AuthenticationSection, RequestPreview, and PresetManager
    - Add Execute button at bottom
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 10.2 Implement state management and handlers

    - Create handleParameterChange handler
    - Create handleBodyChange handler
    - Create handleAuthChange handler
    - Create validateInputs function
    - Disable Execute button when validation fails
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 10.3 Wire up request execution
    - Connect Execute button to executeRequest function
    - Show loading state during execution
    - Display ResponseViewer when response received
    - Show error toast on execution failure
    - _Requirements: 7.5_

- [x] 11. Integrate RequestBuilder into API Explorer

  - Update apps/web/app/api-explorer/page.tsx to use RequestBuilder instead of EndpointDetail in center panel
  - Pass selected endpoint, allSchemas, and baseUrl props to RequestBuilder
  - Ensure RequestBuilder displays when endpoint is selected
  - Verify three-panel layout still works correctly
  - _Requirements: 1.1_

- [x] 12. Add error handling and polish
  - Add comprehensive error handling for network errors, timeouts, and CORS issues
  - Add user-friendly error messages with retry options
  - Add toast notifications for success/error states
  - Ensure all inputs have proper labels and accessibility attributes
  - Add keyboard navigation support
  - Test responsive design on mobile devices
  - _Requirements: 7.1, 7.2, 7.5_
