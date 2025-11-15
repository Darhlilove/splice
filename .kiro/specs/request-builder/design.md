# Request Builder Design Document

## Overview

The Request Builder transforms the API Explorer from a static documentation viewer into an interactive API testing tool. It enables developers to construct, preview, and execute HTTP requests directly from the browser by providing dynamic form inputs for parameters, authentication, and request bodies based on OpenAPI specifications.

This design integrates seamlessly with the existing three-panel ExplorerLayout, replacing the static EndpointDetail component with an interactive request builder in the center panel.

## Architecture

### High-Level Component Structure

```
api-explorer/page.tsx (existing)
├── ExplorerLayout (existing)
│   ├── Left Panel: EndpointList (existing)
│   ├── Center Panel: RequestBuilder (NEW)
│   │   ├── EndpointHeader
│   │   ├── ParameterForm
│   │   ├── RequestBodyEditor
│   │   ├── AuthenticationSection
│   │   ├── RequestPreview
│   │   └── ExecuteButton
│   └── Right Panel: CodeSamples (existing)
```

### Data Flow

1. **User selects endpoint** → EndpointList emits selected endpoint
2. **RequestBuilder receives endpoint** → Analyzes parameters, request body, and security requirements
3. **User fills form** → State updates trigger RequestPreview updates
4. **User clicks Execute** → Validates inputs → Makes HTTP request → Displays response
5. **Response received** → Updates ResponseViewer component

### State Management

We'll use React Context to manage request builder state across components:

```typescript
interface RequestBuilderState {
  endpoint: Endpoint | null;
  parameters: Record<string, ParameterValue>;
  requestBody: string | Record<string, unknown>;
  authentication: AuthConfig;
  presets: Record<string, PresetConfig>;
  response: ResponseData | null;
  isExecuting: boolean;
  validationErrors: ValidationError[];
}
```

## Components and Interfaces

### 1. RequestBuilder (Main Component)

**Location:** `apps/web/components/RequestBuilder.tsx`

**Purpose:** Orchestrates all sub-components and manages request execution

**Props:**

```typescript
interface RequestBuilderProps {
  endpoint: Endpoint;
  allSchemas: Record<string, SchemaObject>;
  baseUrl?: string;
}
```

**State:**

- Parameter values (query, path, header, cookie)
- Request body content
- Authentication credentials
- Validation errors
- Execution status
- Response data

**Key Methods:**

- `handleParameterChange(name: string, value: unknown): void`
- `handleBodyChange(body: string | object): void`
- `handleAuthChange(auth: AuthConfig): void`
- `validateInputs(): ValidationError[]`
- `executeRequest(): Promise<void>`
- `buildFinalRequest(): RequestConfig`

### 2. ParameterForm Component

**Location:** `apps/web/components/ParameterForm.tsx`

**Purpose:** Dynamically generates form inputs for all parameter types

**Props:**

```typescript
interface ParameterFormProps {
  parameters: Parameter[];
  values: Record<string, ParameterValue>;
  errors: Record<string, string>;
  onChange: (name: string, value: unknown) => void;
}
```

**Features:**

- Groups parameters by location (query, path, header, cookie)
- Renders appropriate input type based on schema:
  - `string` → Text input
  - `number`/`integer` → Number input
  - `boolean` → Checkbox
  - `enum` → Select dropdown
  - `array` → Multi-select or comma-separated input
- Displays required indicators
- Shows parameter descriptions as helper text
- Validates inputs and displays errors

**Component Structure:**

```typescript
<Accordion type="multiple" defaultValue={["query", "path"]}>
  <AccordionItem value="query">
    <AccordionTrigger>Query Parameters (3)</AccordionTrigger>
    <AccordionContent>
      {queryParams.map((param) => (
        <ParameterInput key={param.name} parameter={param} />
      ))}
    </AccordionContent>
  </AccordionItem>
  {/* Repeat for path, header, cookie */}
</Accordion>
```

### 3. ParameterInput Component

**Location:** `apps/web/components/ParameterInput.tsx`

**Purpose:** Renders a single parameter input with validation

**Props:**

```typescript
interface ParameterInputProps {
  parameter: Parameter;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}
```

**Input Type Selection Logic:**

```typescript
function getInputComponent(schema: SchemaObject) {
  if (schema.enum) return SelectInput;
  if (schema.type === "boolean") return CheckboxInput;
  if (schema.type === "number" || schema.type === "integer") return NumberInput;
  if (schema.type === "array") return ArrayInput;
  return TextInput;
}
```

**Validation:**

- Required field validation
- Type validation (string, number, boolean)
- Pattern validation (regex)
- Min/max validation (for numbers and strings)
- Enum validation

### 4. RequestBodyEditor Component

**Location:** `apps/web/components/RequestBodyEditor.tsx`

**Purpose:** Provides editor for JSON or form-data request bodies

**Props:**

```typescript
interface RequestBodyEditorProps {
  requestBody: RequestBody;
  value: string | Record<string, unknown>;
  contentType: string;
  schema?: SchemaObject;
  allSchemas: Record<string, SchemaObject>;
  onChange: (value: string | object) => void;
  onContentTypeChange: (contentType: string) => void;
}
```

**Features:**

- Content type selector (if multiple content types available)
- For `application/json`:
  - Monaco Editor with JSON syntax highlighting
  - Schema-based autocomplete
  - Real-time JSON validation
  - Format/prettify button
  - Example value pre-population
- For `application/x-www-form-urlencoded` or `multipart/form-data`:
  - Dynamic form fields based on schema properties
  - File upload inputs for multipart
- Schema viewer showing expected structure

**Implementation:**

```typescript
// Use Monaco Editor for JSON
import Editor from "@monaco-editor/react";

<Editor
  height="300px"
  language="json"
  theme="vs-dark"
  value={jsonValue}
  onChange={handleEditorChange}
  options={{
    minimap: { enabled: false },
    formatOnPaste: true,
    formatOnType: true,
  }}
/>;
```

### 5. AuthenticationSection Component

**Location:** `apps/web/components/AuthenticationSection.tsx`

**Purpose:** Handles authentication credential input

**Props:**

```typescript
interface AuthenticationSectionProps {
  securitySchemes?: SecurityScheme[];
  value: AuthConfig;
  onChange: (auth: AuthConfig) => void;
}

interface AuthConfig {
  type: "apiKey" | "bearer" | "basic" | "oauth2" | "none";
  apiKey?: string;
  apiKeyLocation?: "header" | "query" | "cookie";
  apiKeyName?: string;
  bearerToken?: string;
  username?: string;
  password?: string;
}
```

**Features:**

- Detects security requirements from OpenAPI spec
- Renders appropriate input based on auth type:
  - API Key: Input field + location display
  - Bearer Token: Input field with "Bearer " prefix
  - Basic Auth: Username + password fields
  - OAuth2: Placeholder with instructions
- Persists credentials in sessionStorage
- Shows/hides password fields
- Clear credentials button

### 6. RequestPreview Component

**Location:** `apps/web/components/RequestPreview.tsx`

**Purpose:** Displays the final HTTP request that will be sent

**Props:**

```typescript
interface RequestPreviewProps {
  method: HTTPMethod;
  url: string;
  headers: Record<string, string>;
  body?: string | object;
}
```

**Display:**

```
GET https://api.example.com/users/123?limit=10&offset=0

Headers:
  Authorization: Bearer eyJhbGc...
  Content-Type: application/json
  X-API-Key: abc123

Body:
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Features:**

- Syntax highlighting for URL, headers, and body
- Copy to clipboard button
- Export as cURL command
- Collapsible sections
- Real-time updates as user modifies inputs

### 7. ResponseViewer Component

**Location:** `apps/web/components/ResponseViewer.tsx`

**Purpose:** Displays HTTP response with formatting

**Props:**

```typescript
interface ResponseViewerProps {
  response: ResponseData;
  expectedSchema?: SchemaObject;
  allSchemas: Record<string, SchemaObject>;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  duration: number;
  timestamp: Date;
}
```

**Features:**

- Status code badge (color-coded: green for 2xx, orange for 4xx, red for 5xx)
- Response time display
- Headers in collapsible section
- Body with syntax highlighting (JSON, XML, HTML, plain text)
- Pretty print / raw toggle
- Copy response button
- Download response button
- Schema validation indicator (matches/doesn't match expected schema)

### 8. PresetManager Component

**Location:** `apps/web/components/PresetManager.tsx`

**Purpose:** Manages saving and loading parameter presets

**Props:**

```typescript
interface PresetManagerProps {
  endpointKey: string; // `${method}:${path}`
  currentValues: Record<string, unknown>;
  onLoadPreset: (preset: PresetConfig) => void;
}

interface PresetConfig {
  name: string;
  parameters: Record<string, unknown>;
  requestBody?: string | object;
  authentication?: AuthConfig;
  createdAt: Date;
}
```

**Features:**

- Save current values as preset (with name prompt)
- List all presets for current endpoint
- Load preset (populates all fields)
- Delete preset
- Export/import presets as JSON
- Stored in localStorage with key: `presets:${method}:${path}`

## Data Models

### Parameter Value Types

```typescript
type ParameterValue = string | number | boolean | string[] | null;

interface ParameterState {
  name: string;
  value: ParameterValue;
  isValid: boolean;
  error?: string;
}
```

### Request Configuration

```typescript
interface RequestConfig {
  method: HTTPMethod;
  url: string; // Full URL with query params and path params replaced
  headers: Record<string, string>;
  body?: string | FormData;
  timeout?: number;
}
```

### Validation Error

```typescript
interface ValidationError {
  field: string; // Parameter name or 'body'
  message: string;
  type: "required" | "type" | "pattern" | "min" | "max" | "enum";
}
```

## Error Handling

### Input Validation Errors

- Display inline below each input field
- Prevent execution when validation fails
- Show summary of all errors above Execute button

### Network Errors

- Timeout errors (default 30s timeout)
- Connection errors (CORS, network unavailable)
- Display user-friendly error messages
- Provide retry button

### Response Errors

- 4xx errors: Show response body with error details
- 5xx errors: Show server error message
- Parse errors: Show raw response if JSON parsing fails

### CORS Handling

- Detect CORS errors
- Suggest using proxy endpoint (`/api/proxy`)
- Provide toggle to use proxy automatically

## Testing Strategy

### Unit Tests

- ParameterInput validation logic
- Request URL building (query params, path params)
- Authentication header construction
- Preset save/load functionality

### Integration Tests

- Full request builder flow: select endpoint → fill params → execute → view response
- Preset management: save → load → verify values
- Authentication: add credentials → verify in request headers
- Error handling: invalid inputs → validation errors displayed

### Manual Testing Scenarios

1. **Simple GET request** (Petstore: GET /pet/{petId})

   - Fill path parameter
   - Execute request
   - Verify response

2. **POST with JSON body** (Petstore: POST /pet)

   - Fill request body
   - Add authentication
   - Execute request
   - Verify response

3. **Complex parameters** (Stripe API)

   - Multiple query parameters
   - Array parameters
   - Enum parameters
   - Verify URL construction

4. **Authentication** (GitHub API)

   - Bearer token auth
   - Verify token in headers
   - Execute authenticated request

5. **Presets**
   - Save parameter set
   - Clear form
   - Load preset
   - Verify all values restored

## Integration with Existing Code

### Modifications to api-explorer/page.tsx

Replace the center panel content:

```typescript
// Before (static detail view)
const centerPanel = selectedEndpoint ? (
  <EndpointDetail endpoint={selectedEndpoint} allSchemas={spec.schemas} />
) : (
  <EmptyState />
);

// After (interactive request builder)
const centerPanel = selectedEndpoint ? (
  <RequestBuilder
    endpoint={selectedEndpoint}
    allSchemas={spec.schemas}
    baseUrl={spec.info.servers?.[0]?.url}
  />
) : (
  <EmptyState />
);
```

### New API Route: /api/proxy

**Location:** `apps/web/app/api/proxy/route.ts`

**Purpose:** Proxy requests to avoid CORS issues

```typescript
export async function POST(request: Request) {
  const { url, method, headers, body } = await request.json();

  // Make request server-side
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Return response with CORS headers
  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") || "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
```

### Storage Utilities

**Location:** `apps/web/lib/request-storage.ts`

```typescript
// Save/load presets
export function savePreset(endpointKey: string, preset: PresetConfig): void;
export function loadPresets(endpointKey: string): PresetConfig[];
export function deletePreset(endpointKey: string, presetName: string): void;

// Save/load auth credentials (session storage)
export function saveAuthCredentials(auth: AuthConfig): void;
export function loadAuthCredentials(): AuthConfig | null;
export function clearAuthCredentials(): void;
```

## UI/UX Considerations

### Layout

- Use Accordion for parameter groups (collapsible sections)
- Sticky Execute button at bottom of form
- Request preview in collapsible card
- Response viewer expands to show full response

### Visual Feedback

- Loading spinner during request execution
- Success/error toast notifications
- Validation errors in red below inputs
- Required fields marked with red asterisk
- Disabled Execute button when validation fails

### Accessibility

- All inputs have proper labels
- Error messages associated with inputs (aria-describedby)
- Keyboard navigation support
- Focus management (focus first error on validation failure)
- Screen reader announcements for request status

### Responsive Design

- Stack parameter groups vertically on mobile
- Full-width inputs on small screens
- Collapsible sections to save space
- Sticky Execute button on mobile

## Performance Considerations

### Optimization Strategies

- Debounce request preview updates (300ms)
- Memoize parameter validation
- Lazy load Monaco Editor (code splitting)
- Virtual scrolling for large parameter lists
- Cache parsed schemas

### Bundle Size

- Monaco Editor is large (~2MB) - load only when needed
- Use dynamic imports for RequestBodyEditor
- Tree-shake unused UI components

## Security Considerations

### Credential Storage

- Store auth credentials in sessionStorage (not localStorage)
- Clear credentials on tab close
- Never log credentials to console
- Warn users about storing sensitive data in presets

### Request Execution

- Validate all inputs before sending
- Sanitize user input in request bodies
- Use HTTPS for all requests
- Implement request timeout (30s default)
- Rate limiting on proxy endpoint

### CORS and Proxy

- Proxy endpoint should validate target URLs
- Block requests to internal/private IPs
- Add rate limiting to prevent abuse
- Log proxy requests for monitoring

## Future Enhancements (Out of Scope for Day 4)

- Request history with replay
- Response comparison (mock vs real)
- Batch request execution
- Environment variables for base URLs
- Request chaining (use response from one request in another)
- WebSocket support
- GraphQL query builder
- Import/export Postman collections
