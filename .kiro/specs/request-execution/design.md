# Design Document: Request Execution and Response Display

## Overview

The Request Execution and Response Display system enables users to execute HTTP requests against APIs and view formatted responses with comprehensive details. The system consists of several interconnected components: an execution engine that validates and sends requests, a CORS proxy for server-side request handling, a response viewer with syntax highlighting, a schema validator that compares responses against OpenAPI specifications, and a session-based history tracker.

This design integrates with the existing request builder (Day 4) to consume parameter inputs and authentication settings, then executes requests and displays results in a user-friendly format.

## Architecture

### High-Level Component Diagram

```mermaid
graph TB
    subgraph "Client Components"
        ExecuteButton[Execute Button]
        ResponseViewer[Response Viewer]
        ResponseFormatter[Response Formatter]
        SchemaValidator[Schema Validator UI]
        HistorySidebar[History Sidebar]
    end

    subgraph "Client State"
        RequestState[Request State Manager]
        HistoryStore[History Store]
    end

    subgraph "API Routes"
        ProxyRoute[/api/proxy]
        HistoryRoute[/api/history]
    end

    subgraph "External"
        TargetAPI[Target API]
        MockServer[Mock Server]
    end

    ExecuteButton --> RequestState
    RequestState --> ProxyRoute
    ProxyRoute --> TargetAPI
    ProxyRoute --> MockServer
    ProxyRoute --> ResponseViewer
    ResponseViewer --> ResponseFormatter
    ResponseViewer --> SchemaValidator
    ResponseViewer --> HistoryStore
    HistoryStore --> HistorySidebar
```

### Request Flow

1. User fills parameters in Request Builder (from Day 4)
2. User clicks Execute button
3. Execute button validates required parameters
4. Request is sent to `/api/proxy` with all details
5. Proxy makes server-side HTTP request
6. Response is returned to client
7. Response is displayed in Response Viewer
8. Response is validated against OpenAPI schema
9. Request/response is stored in History

## Components and Interfaces

### 1. Execute Button Component

**Location:** `app/components/ExecuteButton.tsx`

**Purpose:** Trigger request execution with validation

**Props Interface:**

```typescript
interface ExecuteButtonProps {
  endpoint: OpenAPIEndpoint;
  parameters: RequestParameters;
  authentication: AuthConfig;
  requestBody?: any;
  onExecute: (response: APIResponse) => void;
  onError: (error: RequestError) => void;
  disabled?: boolean;
}

interface RequestParameters {
  path: Record<string, string>;
  query: Record<string, string>;
  header: Record<string, string>;
  cookie: Record<string, string>;
}

interface AuthConfig {
  type: "none" | "apiKey" | "bearer" | "oauth";
  value?: string;
  location?: "header" | "query" | "cookie";
  name?: string;
}
```

**Behavior:**

- Validates all required parameters before execution
- Shows loading spinner during request
- Disables button during execution
- Handles validation errors with specific messages
- Triggers request through proxy API

### 2. Response Viewer Component

**Location:** `app/components/ResponseViewer.tsx`

**Purpose:** Display HTTP response with formatting and details

**Props Interface:**

```typescript
interface ResponseViewerProps {
  response: APIResponse | null;
  schema?: OpenAPIResponseSchema;
  loading?: boolean;
  error?: RequestError;
}

interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  responseTime: number;
  timestamp: Date;
  contentType: string;
}

interface RequestError {
  type: "network" | "timeout" | "validation" | "server";
  message: string;
  details?: any;
}
```

**Features:**

- Color-coded status display (2xx=green, 4xx=orange, 5xx=red)
- Collapsible headers section
- Syntax-highlighted response body
- Response time display
- Content type detection

### 3. Response Formatter Component

**Location:** `app/components/ResponseFormatter.tsx`

**Purpose:** Provide formatting and export options for responses

**Props Interface:**

```typescript
interface ResponseFormatterProps {
  response: APIResponse;
  format: "pretty" | "minified" | "raw";
  onFormatChange: (format: string) => void;
}
```

**Features:**

- Pretty print JSON with indentation
- Minify JSON to single line
- Copy to clipboard with confirmation
- Download as file (JSON, XML, HTML, text)
- Format toggle buttons

### 4. Schema Validator Component

**Location:** `app/components/SchemaValidator.tsx`

**Purpose:** Compare response against OpenAPI schema

**Props Interface:**

```typescript
interface SchemaValidatorProps {
  response: any;
  schema: OpenAPIResponseSchema;
  onValidationComplete: (result: ValidationResult) => void;
}

interface ValidationResult {
  valid: boolean;
  matchingFields: string[];
  extraFields: string[];
  missingFields: string[];
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  expected: string;
  actual: string;
  message: string;
}
```

**Features:**

- Highlight matching fields in green
- Highlight extra fields in yellow
- Highlight missing required fields in red
- Display validation summary
- Show field-by-field comparison

### 5. History Sidebar Component

**Location:** `app/components/HistorySidebar.tsx`

**Purpose:** Display and manage request history

**Props Interface:**

```typescript
interface HistorySidebarProps {
  history: HistoryEntry[];
  onSelectEntry: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
  maxEntries?: number;
}

interface HistoryEntry {
  id: string;
  timestamp: Date;
  method: string;
  endpoint: string;
  parameters: RequestParameters;
  response: APIResponse;
  status: number;
  responseTime: number;
}
```

**Features:**

- Display last 10 requests
- Show timestamp, method, endpoint, status
- Click to view previous response
- Clear history button
- Export history as JSON

### 6. CORS Proxy API Route

**Location:** `app/api/proxy/route.ts`

**Purpose:** Make server-side HTTP requests to avoid CORS issues

**Request Interface:**

```typescript
interface ProxyRequest {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  responseTime: number;
}
```

**Implementation Details:**

- Accept POST requests with request details
- Use axios for HTTP requests
- Set timeout (default 30 seconds)
- Forward all headers except restricted ones
- Capture response time
- Handle errors gracefully
- Return structured response

**Security Considerations:**

- Validate URL format
- Restrict to HTTP/HTTPS protocols
- Sanitize headers
- Limit request body size
- Rate limiting (future enhancement)

## Data Models

### Request State Manager

**Location:** `app/lib/requestState.ts`

**Purpose:** Manage request execution state

```typescript
interface RequestState {
  loading: boolean;
  response: APIResponse | null;
  error: RequestError | null;
  validationResult: ValidationResult | null;
}

class RequestStateManager {
  private state: RequestState;

  setLoading(loading: boolean): void;
  setResponse(response: APIResponse): void;
  setError(error: RequestError): void;
  setValidationResult(result: ValidationResult): void;
  reset(): void;
  getState(): RequestState;
}
```

### History Store

**Location:** `app/lib/historyStore.ts`

**Purpose:** Store and retrieve request history

```typescript
class HistoryStore {
  private entries: HistoryEntry[];
  private maxEntries: number = 10;

  addEntry(entry: HistoryEntry): void;
  getEntries(): HistoryEntry[];
  getEntry(id: string): HistoryEntry | null;
  clearHistory(): void;
  exportHistory(): string; // JSON string
}
```

**Storage:** Session-based (in-memory or sessionStorage)

### Schema Validator Utility

**Location:** `app/lib/schemaValidator.ts`

**Purpose:** Validate responses against OpenAPI schemas

```typescript
class SchemaValidator {
  validate(response: any, schema: OpenAPIResponseSchema): ValidationResult;
  private compareFields(response: any, schema: any): FieldComparison;
  private findMissingFields(response: any, schema: any): string[];
  private findExtraFields(response: any, schema: any): string[];
}
```

## Error Handling

### Error Types and Messages

1. **Validation Errors**

   - Missing required parameters
   - Invalid parameter format
   - Message: "Required parameter '{name}' is missing"

2. **Network Errors**

   - Connection refused
   - DNS resolution failed
   - Message: "Unable to connect to {url}"

3. **Timeout Errors**

   - Request exceeds timeout limit
   - Message: "Request timed out after {seconds} seconds"

4. **Server Errors**
   - 4xx client errors
   - 5xx server errors
   - Message: "{status} {statusText}: {errorBody}"

### Error Display

- Show error type icon (⚠️ for validation, 🔌 for network, ⏱️ for timeout)
- Display error message prominently
- Show error details in collapsible section
- Provide "Retry" button
- Suggest fixes when possible

### Retry Logic

- Retry button re-executes last request
- Preserve all parameters and settings
- Reset error state before retry
- Track retry count (max 3 retries)

## Testing Strategy

### Unit Tests

1. **Execute Button**

   - Test parameter validation
   - Test loading state management
   - Test error handling
   - Test disabled state

2. **Response Viewer**

   - Test status code color mapping
   - Test syntax highlighting for different content types
   - Test header display
   - Test response time formatting

3. **Response Formatter**

   - Test JSON pretty print
   - Test JSON minify
   - Test clipboard copy
   - Test file download

4. **Schema Validator**

   - Test field matching
   - Test extra field detection
   - Test missing field detection
   - Test nested object validation

5. **History Store**
   - Test entry addition
   - Test max entries limit
   - Test entry retrieval
   - Test history clearing
   - Test export functionality

### Integration Tests

1. **End-to-End Request Flow**

   - Fill parameters → Execute → View response
   - Test with different HTTP methods
   - Test with different content types
   - Test with authentication

2. **CORS Proxy**

   - Test successful requests
   - Test error responses
   - Test timeout handling
   - Test header forwarding

3. **History Integration**
   - Execute request → Check history
   - Select history entry → View response
   - Clear history → Verify empty

### Manual Testing

1. **Real API Testing**

   - Test with Petstore API (https://petstore.swagger.io/v2)
   - Test GET, POST, PUT, DELETE methods
   - Test with query parameters
   - Test with request body

2. **Mock Server Testing**

   - Toggle to mock mode
   - Execute requests
   - Verify mock responses
   - Compare with real API responses

3. **Error Scenarios**
   - Test with invalid URL
   - Test with unreachable endpoint
   - Test with malformed request body
   - Test with missing authentication

## Performance Considerations

### Response Rendering

- Use React.memo for Response Viewer
- Lazy load syntax highlighter
- Virtualize large response bodies
- Debounce format changes

### History Management

- Limit to 10 entries
- Store only essential data
- Use efficient data structures
- Clear on session end

### Proxy Optimization

- Set reasonable timeout (30s)
- Stream large responses
- Compress response data
- Cache identical requests (optional)

## UI/UX Design

### Layout

```
┌─────────────────────────────────────────────────────┐
│  [Execute Button] [Loading Spinner]                 │
├─────────────────────────────────────────────────────┤
│  Response                                            │
│  ┌───────────────────────────────────────────────┐ │
│  │ Status: 200 OK (green) | Time: 245ms          │ │
│  │ [Pretty] [Minify] [Copy] [Download]           │ │
│  ├───────────────────────────────────────────────┤ │
│  │ Headers ▼                                      │ │
│  │   Content-Type: application/json              │ │
│  │   Content-Length: 1234                        │ │
│  ├───────────────────────────────────────────────┤ │
│  │ Body                                           │ │
│  │ {                                              │ │
│  │   "id": 123,                                   │ │
│  │   "name": "Example"                            │ │
│  │ }                                              │ │
│  └───────────────────────────────────────────────┘ │
│                                                      │
│  Schema Validation                                   │
│  ┌───────────────────────────────────────────────┐ │
│  │ ✓ Matches schema                               │ │
│  │ • id (number) ✓                                │ │
│  │ • name (string) ✓                              │ │
│  │ • extra_field (unknown) ⚠                      │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────┐
│ History         │
├─────────────────┤
│ ● GET /users    │
│   200 | 245ms   │
│   2 min ago     │
├─────────────────┤
│ ● POST /users   │
│   201 | 312ms   │
│   5 min ago     │
└─────────────────┘
```

### Color Scheme

- **Success (2xx):** Green (#10b981)
- **Client Error (4xx):** Orange (#f59e0b)
- **Server Error (5xx):** Red (#ef4444)
- **Loading:** Blue (#3b82f6)
- **Validation Match:** Green background (#d1fae5)
- **Validation Extra:** Yellow background (#fef3c7)
- **Validation Missing:** Red background (#fee2e2)

### Animations

- Loading spinner during request
- Fade in response display
- Smooth collapse/expand for headers
- Toast notification for copy/download
- Highlight animation for history selection

## Dependencies

### Required Libraries

- **axios** (^1.6.0): HTTP client for proxy requests
- **react-syntax-highlighter** (^15.5.0): Syntax highlighting
- **@types/react-syntax-highlighter**: TypeScript types
- **ajv** (^8.12.0): JSON schema validation (for schema validator)

### Existing Dependencies

- **@heroui/react**: UI components
- **framer-motion**: Animations
- **react-aria**: Accessibility

## Integration Points

### With Request Builder (Day 4)

- Consume parameter values from ParameterForm
- Consume authentication config from AuthSection
- Consume request body from RequestBodyEditor
- Use request preview URL

### With Mock Server (Day 6)

- Check mock server toggle state
- Route requests to mock server URL when enabled
- Route requests to real API when disabled
- Display which endpoint is being used

### With Schema Explorer (Day 3)

- Retrieve OpenAPI response schema for validation
- Display endpoint information
- Link to endpoint documentation

## Future Enhancements

1. **Request Collections**

   - Save favorite requests
   - Organize into folders
   - Share with team

2. **Response Comparison**

   - Compare multiple responses
   - Diff view for changes
   - Track response evolution

3. **Advanced Validation**

   - Custom validation rules
   - Response assertions
   - Test automation

4. **Performance Monitoring**

   - Response time trends
   - Success rate tracking
   - Error analytics

5. **Collaboration**
   - Share request history
   - Comment on responses
   - Team workspaces
