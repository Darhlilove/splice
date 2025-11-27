# SDK Generator Manual Testing Guide

This document provides instructions for manually testing the SDK generator with various OpenAPI specifications.

## Prerequisites

1. Install OpenAPI Generator CLI:

   ```bash
   npm install -g @openapitools/openapi-generator-cli
   ```

2. Verify installation:
   ```bash
   openapi-generator-cli version
   ```

## Test Scenarios

### 1. Simple Spec - Petstore

**Objective**: Verify basic SDK generation works with a simple specification.

**Steps**:

1. Use the Petstore spec from `public/test-specs/petstore-openapi-spec.yaml`
2. Generate SDK via the UI or API:
   ```bash
   curl -X POST http://localhost:3000/api/sdk/generate \
     -H "Content-Type: application/json" \
     -d '{
       "specId": "petstore",
       "spec": <petstore-spec-content>,
       "config": {
         "packageName": "petstore-client",
         "packageVersion": "1.0.0",
         "author": "Test User",
         "description": "Petstore API client",
         "language": "typescript"
       }
     }'
   ```
3. Download the generated ZIP file
4. Extract and verify contents

**Expected Results**:

- ✅ Generation completes in < 30 seconds
- ✅ ZIP file is created and downloadable
- ✅ package.json contains correct name and version
- ✅ TypeScript files are present (.ts extension)
- ✅ README.md exists with installation instructions
- ✅ README contains code examples
- ✅ API client classes are generated
- ✅ TypeScript interfaces for Pet model exist

**Verification Commands**:

```bash
# Extract ZIP
unzip petstore-client.zip -d petstore-client

# Check package.json
cat petstore-client/package.json | grep "petstore-client"

# Check for TypeScript files
find petstore-client -name "*.ts" | head -5

# Check README
cat petstore-client/README.md | grep "Installation"

# Try to compile (optional)
cd petstore-client
npm install
npm run build
```

---

### 2. Complex Spec - Stripe

**Objective**: Verify SDK generation handles complex, real-world specifications.

**Steps**:

1. Use the Stripe spec from `public/test-specs/stripe-spec.yaml`
2. Generate SDK with config:
   ```json
   {
     "packageName": "stripe-client",
     "packageVersion": "1.0.0",
     "author": "Test User",
     "description": "Stripe API client",
     "language": "typescript"
   }
   ```
3. Monitor generation progress
4. Download and extract ZIP

**Expected Results**:

- ✅ Generation completes (may take longer due to complexity)
- ✅ No timeout errors (< 60 seconds)
- ✅ All Stripe endpoints are included
- ✅ Complex nested types are generated correctly
- ✅ Authentication examples in README
- ✅ Multiple API classes for different resources
- ✅ Proper TypeScript type definitions

**Verification Commands**:

```bash
# Extract and check size
unzip stripe-client.zip -d stripe-client
du -sh stripe-client

# Count generated files
find stripe-client -name "*.ts" | wc -l

# Check for specific Stripe models
grep -r "Customer" stripe-client/
grep -r "Payment" stripe-client/

# Verify README has auth section
cat stripe-client/README.md | grep -i "authentication"
```

---

### 3. Large Spec - Twilio

**Objective**: Verify SDK generation handles large specifications efficiently.

**Steps**:

1. Use the Twilio spec from `public/test-specs/twilio_accounts_v1.yaml`
2. Generate SDK with config:
   ```json
   {
     "packageName": "twilio-accounts-client",
     "packageVersion": "1.0.0",
     "language": "typescript"
   }
   ```
3. Monitor memory usage during generation
4. Verify generation completes without timeout

**Expected Results**:

- ✅ Generation completes within timeout (< 60 seconds)
- ✅ Memory usage stays reasonable (< 500MB)
- ✅ All Twilio endpoints are included
- ✅ Large number of models generated correctly
- ✅ No missing or broken references
- ✅ README is comprehensive

**Verification Commands**:

```bash
# Extract and analyze
unzip twilio-accounts-client.zip -d twilio-accounts-client

# Count endpoints/operations
grep -r "operationId" twilio-accounts-client/ | wc -l

# Check for compilation errors
cd twilio-accounts-client
npm install
npx tsc --noEmit
```

---

## Error Scenario Testing

### 4. Invalid Spec

**Objective**: Verify proper error handling for invalid specifications.

**Test Cases**:

#### 4.1 Missing Required Fields

```json
{
  "openapi": "3.0.0"
  // Missing info and paths
}
```

**Expected**: Clear error message indicating missing fields

#### 4.2 Invalid Path Format

```json
{
  "openapi": "3.0.0",
  "info": { "title": "Test", "version": "1.0.0" },
  "paths": {
    "invalid-path": {
      // Should start with /
      "get": { "responses": { "200": { "description": "OK" } } }
    }
  }
}
```

**Expected**: Error message about path format

#### 4.3 No Operations

```json
{
  "openapi": "3.0.0",
  "info": { "title": "Test", "version": "1.0.0" },
  "paths": {
    "/test": {} // No operations defined
  }
}
```

**Expected**: Error message about missing operations

---

### 5. Invalid Configuration

**Test Cases**:

#### 5.1 Invalid Package Name

```json
{
  "packageName": "INVALID NAME WITH SPACES",
  "packageVersion": "1.0.0",
  "language": "typescript"
}
```

**Expected**: Validation error for package name

#### 5.2 Invalid Version

```json
{
  "packageName": "test-sdk",
  "packageVersion": "not-a-version",
  "language": "typescript"
}
```

**Expected**: Validation error for version format

#### 5.3 Description Too Long

```json
{
  "packageName": "test-sdk",
  "packageVersion": "1.0.0",
  "description": "<string with 501+ characters>",
  "language": "typescript"
}
```

**Expected**: Validation error for description length

---

### 6. Concurrent Generation

**Objective**: Verify concurrent generation limiting works correctly.

**Steps**:

1. Start 5 SDK generations simultaneously
2. Monitor which ones succeed and which are queued/rejected
3. Verify no more than 3 run concurrently

**Expected Results**:

- ✅ Maximum 3 generations run concurrently
- ✅ Additional requests receive "concurrent limit" error
- ✅ Queued requests can retry after others complete
- ✅ No system instability or crashes

---

## Compilation Testing

### 7. Verify Generated SDKs Compile

For each generated SDK:

```bash
cd <sdk-directory>
npm install
npm run build
```

**Expected Results**:

- ✅ No TypeScript compilation errors
- ✅ All types are properly defined
- ✅ No missing imports
- ✅ Build completes successfully

---

## README Accuracy Testing

### 8. Verify README Examples

For each generated SDK:

1. Read the README.md file
2. Copy the installation example
3. Copy the quick start example
4. Copy the authentication example (if present)
5. Verify examples are syntactically correct

**Expected Results**:

- ✅ Installation command is correct
- ✅ Import statements are valid
- ✅ API initialization code works
- ✅ Example method calls match generated API
- ✅ Authentication examples are accurate

---

## Performance Testing

### 9. Generation Time Benchmarks

Test generation time for different spec sizes:

| Spec Type         | Expected Time | Actual Time | Pass/Fail |
| ----------------- | ------------- | ----------- | --------- |
| Simple (Petstore) | < 15s         | \_\_\_      | \_\_\_    |
| Medium (Stripe)   | < 30s         | \_\_\_      | \_\_\_    |
| Large (Twilio)    | < 60s         | \_\_\_      | \_\_\_    |

---

## Cleanup Testing

### 10. File Expiration

**Objective**: Verify generated files are cleaned up after expiration.

**Steps**:

1. Generate an SDK
2. Note the file ID and download URL
3. Wait for expiration time (1 hour by default)
4. Try to download the file again

**Expected Results**:

- ✅ File is accessible immediately after generation
- ✅ File is accessible within expiration window
- ✅ File returns 404 or error after expiration
- ✅ Cleanup process removes expired files
- ✅ Disk space is freed

---

## Test Results Template

```markdown
## Test Execution Results

**Date**: ****\_\_\_****
**Tester**: ****\_\_\_****
**Environment**: ****\_\_\_****

### Test 1: Petstore (Simple)

- [ ] Generation completed
- [ ] Time: \_\_\_ seconds
- [ ] ZIP created
- [ ] package.json correct
- [ ] TypeScript files present
- [ ] README exists
- [ ] Compiles successfully
- **Notes**: ****\_\_\_****

### Test 2: Stripe (Complex)

- [ ] Generation completed
- [ ] Time: \_\_\_ seconds
- [ ] All endpoints included
- [ ] Complex types correct
- [ ] README has auth section
- [ ] Compiles successfully
- **Notes**: ****\_\_\_****

### Test 3: Twilio (Large)

- [ ] Generation completed
- [ ] Time: \_\_\_ seconds
- [ ] Memory usage acceptable
- [ ] All endpoints included
- [ ] Compiles successfully
- **Notes**: ****\_\_\_****

### Test 4-6: Error Scenarios

- [ ] Invalid spec handled correctly
- [ ] Invalid config handled correctly
- [ ] Concurrent limit enforced
- **Notes**: ****\_\_\_****

### Test 7-8: Quality Checks

- [ ] Generated SDKs compile
- [ ] README examples accurate
- **Notes**: ****\_\_\_****

### Test 9-10: Performance & Cleanup

- [ ] Generation times acceptable
- [ ] File cleanup works
- **Notes**: ****\_\_\_****

### Overall Assessment

- **Pass/Fail**: ****\_\_\_****
- **Issues Found**: ****\_\_\_****
- **Recommendations**: ****\_\_\_****
```

---

## Troubleshooting

### Common Issues

1. **OpenAPI Generator not found**

   - Install: `npm install -g @openapitools/openapi-generator-cli`
   - Verify: `openapi-generator-cli version`

2. **Generation timeout**

   - Check spec complexity
   - Verify system resources
   - Check OpenAPI Generator logs

3. **Compilation errors in generated SDK**

   - Check OpenAPI spec validity
   - Verify TypeScript version compatibility
   - Check for unsupported OpenAPI features

4. **Missing files in ZIP**
   - Check generation logs
   - Verify OpenAPI Generator completed successfully
   - Check file permissions

---

## Automation

To automate some of these tests, you can use the integration test suite:

```bash
# Run all integration tests
pnpm vitest --run tests/sdk-generation-integration.test.ts

# Run error scenario tests
pnpm vitest --run tests/sdk-generation-error-scenarios.test.ts
```

Note: Integration tests require OpenAPI Generator CLI to be installed.
