# Manual Testing Guide for Mock Server Integration

This guide provides instructions for manually testing the mock server integration feature.

## Prerequisites

1. **Install Prism CLI**:

   ```bash
   npm install -g @stoplight/prism-cli
   # or
   yarn global add @stoplight/prism-cli
   # or
   pnpm add -g @stoplight/prism-cli
   ```

2. **Verify Installation**:
   ```bash
   prism --version
   ```

## Automated Manual Testing Script

Run the comprehensive manual testing script:

```bash
npx tsx tests/manual-testing-script.ts
```

This script will automatically test:

- ✅ Petstore spec
- ✅ Stripe spec
- ✅ Invalid spec handling
- ✅ Concurrent mock servers
- ✅ Port conflict resolution
- ✅ Server restart cycles

## Manual Testing Checklist

### Test 1: Petstore Spec

**Objective**: Verify basic mock server functionality with a simple spec

**Steps**:

1. Start the development server: `pnpm dev`
2. Navigate to the explorer page
3. Upload `public/test-specs/petstore-openapi-spec.json`
4. Click "Start Mock Server"
5. Verify server status shows "Running" with a green badge
6. Verify server URL is displayed (e.g., `http://localhost:4010`)
7. Click the server URL to open in a new tab
8. Try accessing `/pets` endpoint
9. Click "Stop Mock Server"
10. Verify server status shows "Stopped"

**Expected Results**:

- ✅ Server starts within 3 seconds
- ✅ Server URL is clickable and opens in new tab
- ✅ Mock endpoints return valid responses
- ✅ Server stops cleanly

### Test 2: Stripe Spec

**Objective**: Test with a complex, real-world API spec

**Steps**:

1. Upload `public/test-specs/stripe-spec.yaml`
2. Click "Start Mock Server"
3. Verify server starts successfully
4. Try accessing Stripe API endpoints
5. Stop the server

**Expected Results**:

- ✅ Complex spec loads without errors
- ✅ Server starts successfully
- ✅ Mock responses match Stripe API structure

### Test 3: Invalid Spec Handling

**Objective**: Verify error handling for invalid specs

**Steps**:

1. Create a file with invalid JSON/YAML
2. Try to upload it
3. Observe error messages

**Expected Results**:

- ✅ Clear error message displayed
- ✅ No server process started
- ✅ User can retry with valid spec

### Test 4: Concurrent Mock Servers

**Objective**: Test running multiple mock servers simultaneously

**Steps**:

1. Upload Petstore spec and start mock server
2. Note the port number (e.g., 4010)
3. Upload Twilio spec and start mock server
4. Note the second port number (e.g., 4011)
5. Verify both servers are running
6. Make requests to both servers
7. Stop both servers

**Expected Results**:

- ✅ Both servers run on different ports
- ✅ Both servers respond independently
- ✅ No port conflicts
- ✅ Both servers can be stopped independently

### Test 5: Port Conflict Resolution

**Objective**: Verify automatic port conflict handling

**Steps**:

1. Start a mock server (gets port 4010)
2. Manually start another Prism process on port 4011:
   ```bash
   prism mock public/test-specs/petstore-openapi-spec.json -p 4011
   ```
3. Start another mock server in the app
4. Verify it gets port 4012 (skips occupied 4011)

**Expected Results**:

- ✅ System automatically finds next available port
- ✅ No errors or crashes
- ✅ User is informed of the assigned port

### Test 6: Request Routing

**Objective**: Test toggling between real and mock endpoints

**Steps**:

1. Start mock server for Petstore spec
2. In Request Builder, select an endpoint (e.g., GET /pets)
3. Toggle "Use Mock Server" ON
4. Verify request preview shows mock server URL
5. Execute request
6. Verify response comes from mock server
7. Toggle "Use Mock Server" OFF
8. Verify request preview shows real API URL
9. Execute request (may fail if real API not available)

**Expected Results**:

- ✅ Toggle switches between mock and real URLs
- ✅ Request preview updates correctly
- ✅ Mock responses are returned when toggle is ON
- ✅ Real API is called when toggle is OFF

### Test 7: Error Recovery

**Objective**: Test system recovery from various error scenarios

**Steps**:

1. Start a mock server
2. Manually kill the Prism process:
   ```bash
   # Find the PID from the UI or:
   ps aux | grep prism
   kill <PID>
   ```
3. Verify UI detects crash and updates status
4. Try to restart the server
5. Verify successful restart

**Expected Results**:

- ✅ Crash detected within 5 seconds
- ✅ Status updates to "Stopped"
- ✅ Error message displayed
- ✅ Server can be restarted successfully

### Test 8: Server Lifecycle

**Objective**: Test multiple start/stop cycles

**Steps**:

1. Start mock server
2. Stop mock server
3. Start mock server again
4. Stop mock server again
5. Repeat 2-3 more times

**Expected Results**:

- ✅ Server starts and stops reliably each time
- ✅ No memory leaks or zombie processes
- ✅ Port is released and reused correctly

### Test 9: UI Responsiveness

**Objective**: Verify UI updates and loading states

**Steps**:

1. Click "Start Mock Server"
2. Observe loading indicator
3. Verify status updates when server starts
4. Click "Stop Mock Server"
5. Observe loading indicator
6. Verify status updates when server stops

**Expected Results**:

- ✅ Loading indicators appear during operations
- ✅ Buttons are disabled during operations
- ✅ Status updates immediately after operations
- ✅ No UI freezing or lag

### Test 10: Prism Not Installed

**Objective**: Test behavior when Prism is not available

**Steps**:

1. Temporarily rename Prism binary:
   ```bash
   # On macOS/Linux
   sudo mv /usr/local/bin/prism /usr/local/bin/prism.bak
   ```
2. Try to start a mock server
3. Observe error message
4. Restore Prism:
   ```bash
   sudo mv /usr/local/bin/prism.bak /usr/local/bin/prism
   ```

**Expected Results**:

- ✅ Clear error message about Prism not being installed
- ✅ Installation instructions displayed
- ✅ Link to Prism documentation provided
- ✅ No crashes or undefined errors

## Performance Testing

### Test 11: Startup Time

**Objective**: Measure mock server startup time

**Steps**:

1. Use browser DevTools Network tab
2. Start mock server
3. Measure time from button click to "Running" status

**Expected Results**:

- ✅ Startup time < 3 seconds for typical specs
- ✅ Startup time < 5 seconds for large specs (Stripe)

### Test 12: Memory Usage

**Objective**: Monitor memory usage with multiple servers

**Steps**:

1. Start 3-5 mock servers
2. Monitor system memory usage
3. Stop all servers
4. Verify memory is released

**Expected Results**:

- ✅ Each server uses < 100MB RAM
- ✅ Memory is released when servers stop
- ✅ No memory leaks after multiple cycles

## Troubleshooting

### Server Won't Start

1. Check if Prism is installed: `prism --version`
2. Check if port is available: `lsof -i :4010`
3. Check console for error messages
4. Try a different spec file

### Server Crashes Immediately

1. Verify spec file is valid OpenAPI format
2. Check Prism logs in console
3. Try running Prism manually:
   ```bash
   prism mock public/test-specs/petstore-openapi-spec.json -p 4010
   ```

### Port Conflicts

1. Check what's using the port: `lsof -i :4010`
2. Kill the process or let the system auto-assign a different port
3. Restart the mock server

## Test Results Template

Use this template to document your manual testing results:

```
Date: ___________
Tester: ___________
Environment: ___________

| Test | Status | Notes |
|------|--------|-------|
| Petstore Spec | ☐ Pass ☐ Fail | |
| Stripe Spec | ☐ Pass ☐ Fail | |
| Invalid Spec | ☐ Pass ☐ Fail | |
| Concurrent Servers | ☐ Pass ☐ Fail | |
| Port Conflict | ☐ Pass ☐ Fail | |
| Request Routing | ☐ Pass ☐ Fail | |
| Error Recovery | ☐ Pass ☐ Fail | |
| Server Lifecycle | ☐ Pass ☐ Fail | |
| UI Responsiveness | ☐ Pass ☐ Fail | |
| Prism Not Installed | ☐ Pass ☐ Fail | |
| Startup Time | ☐ Pass ☐ Fail | |
| Memory Usage | ☐ Pass ☐ Fail | |

Overall Result: ☐ Pass ☐ Fail

Issues Found:
1.
2.
3.

Recommendations:
1.
2.
3.
```

## Automated Testing

For automated testing, run:

```bash
# Unit tests
pnpm vitest --run tests/mock-server-manager.test.ts

# Integration tests
pnpm vitest --run tests/mock-server-integration.test.ts

# All tests
pnpm test
```

## Additional Resources

- [Prism Documentation](https://docs.stoplight.io/docs/prism/674b27b261c3c-prism-overview)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Project Requirements](.kiro/specs/mock-server-integration/requirements.md)
- [Project Design](.kiro/specs/mock-server-integration/design.md)
