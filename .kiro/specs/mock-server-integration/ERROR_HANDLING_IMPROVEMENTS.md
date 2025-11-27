# Mock Server Error Handling Improvements

## Overview

Implemented comprehensive error handling improvements for the mock server integration to provide user-friendly error messages and actionable recovery steps, as specified in the mock-server-integration spec requirements.

## Changes Made

### 1. Enhanced Error Parsing (`packages/openapi/src/mock-manager.ts`)

**Added `parseSpecError()` method** that intelligently parses Prism error output:

- **Handles JSON error objects**: Extracts meaningful error information from complex Prism error responses
- **Detects MissingPointerError**: Specifically handles the `EMISSINGPOINTER` error code
- **Provides context**: Explains which schema reference is missing and where
- **Fallback handling**: Gracefully handles unparseable errors with generic messages

**Example transformation**:

```
Before: "MissingPointerError: at "#/endpoints/2/responses/200/content/application~1xml/schema/items", token "components" in "#/components/schemas/Pet" does not exist..."

After: "Invalid OpenAPI specification: Missing schema reference "#/components/schemas/Pet". The schema component "components" is referenced but not defined in the spec."
```

### 2. Improved API Error Responses (`apps/web/app/api/mock/start/route.ts`)

**Enhanced error categorization** with specific error types:

- `PRISM_NOT_INSTALLED`: Prism CLI is not available
- `INVALID_SPEC`: OpenAPI specification has validation errors
- `NO_PORTS_AVAILABLE`: All ports in range are occupied
- `PORT_CONFLICT`: Specific port is already in use
- `STARTUP_TIMEOUT`: Server took too long to start

**Better HTTP status codes**:

- `400`: Invalid specification (client error)
- `503`: Service unavailable (Prism not installed, no ports)
- `504`: Gateway timeout (startup timeout)
- `500`: Unknown server error

### 3. User-Friendly Error Display (`apps/web/components/MockServerControls.tsx`)

**Enhanced error UI** with contextual help:

- **Installation instructions**: Shows npm/yarn/pnpm commands for Prism installation
- **Validation guidance**: Explains how to fix missing schema references
- **External links**: Provides links to Swagger Editor and Prism documentation
- **Actionable suggestions**: Tells users exactly what to do to fix the issue

### 4. Reusable Error Utilities

**Created `apps/web/lib/mock-server-errors.ts`**:

- `parseMockServerError()`: Categorizes errors and provides suggestions
- `getErrorTitle()`: Returns user-friendly titles for error types

**Created `apps/web/components/MockServerErrorDisplay.tsx`**:

- Reusable error display component
- Shows error message, suggestions, and helpful links
- Includes retry and dismiss actions
- Consistent styling with shadcn/ui Alert component

**Created `apps/web/components/ui/alert.tsx`**:

- shadcn/ui compatible Alert component
- Supports default and destructive variants
- Accessible with proper ARIA roles

## Spec Requirements Addressed

### Requirement 5: Error Recovery

✅ **5.1**: Invalid spec errors now show specific validation errors
✅ **5.2**: Prism installation check with clear instructions
✅ **5.3**: Unsupported features identified (via error parsing)
✅ **5.4**: Detailed error logging while showing user-friendly messages
✅ **5.5**: User-friendly error messages with recovery suggestions

### Error Scenarios Covered

1. **Prism Not Installed**

   - Detection: Command execution fails
   - Response: Installation instructions with package manager commands
   - Recovery: Links to Prism documentation

2. **Invalid Spec - Missing References**

   - Detection: EMISSINGPOINTER error code
   - Response: Explains which schema is missing
   - Recovery: Suggests checking $ref pointers and using Swagger Editor

3. **YAML/JSON Parsing Errors**

   - Detection: Error message contains "YAML" or "JSON"
   - Response: Explains syntax error
   - Recovery: Link to Swagger Editor for validation

4. **Port Conflicts**

   - Detection: EADDRINUSE error
   - Response: Explains port is in use
   - Recovery: Automatic retry with next available port

5. **No Available Ports**
   - Detection: All ports 4010-4099 occupied
   - Response: Explains port range exhaustion
   - Recovery: Suggests stopping other services

## Testing

### Manual Testing Checklist

- [x] Test with invalid spec (missing schema reference) - Shows user-friendly error
- [x] Test with Prism not installed - Shows installation instructions
- [x] Test with port conflict - Automatically retries with next port
- [x] Test with all ports occupied - Shows clear error message
- [x] Test error dismissal - Error can be dismissed
- [x] Test error retry - Retry button works correctly

### Error Message Examples

**Before (Raw Prism Error)**:

```
Prism startup failed: {stack: 'MissingPointerError: at "#/endpoints/2/responses/200/content/application~1xml/schema/items", token "components" in "#/components/schemas/Pet" does not exist...
```

**After (User-Friendly)**:

```
Invalid OpenAPI Specification

Invalid OpenAPI specification: Missing schema reference "#/components/schemas/Pet".
The schema component "components" is referenced but not defined in the spec.

How to fix:
• Check that all $ref pointers point to valid schema definitions
• Ensure all referenced schemas exist in the components/schemas section
• Validate your spec using an online validator

Helpful resources:
• Open Swagger Editor →
• OpenAPI Specification Guide →
```

## Benefits

1. **Better User Experience**: Users understand what went wrong and how to fix it
2. **Faster Debugging**: Clear error messages reduce support burden
3. **Self-Service**: Users can resolve issues without external help
4. **Spec Compliance**: Fully implements error handling requirements from the spec
5. **Maintainability**: Centralized error handling logic is easy to extend

## Future Enhancements

1. **Error Analytics**: Track common errors to improve documentation
2. **Inline Spec Validation**: Validate spec before attempting to start server
3. **Auto-Fix Suggestions**: Automatically fix common spec issues
4. **Error History**: Keep track of past errors for debugging
5. **Spec Linting**: Integrate with OpenAPI linters for proactive error detection
