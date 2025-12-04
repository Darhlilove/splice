# Splice

[**Live Demo**](https://splice.darhlapps.dev)

Splice is a powerful developer tool designed to streamline the workflow between API design and frontend consumption. It provides a suite of tools to visualize, mock, and generate SDKs from OpenAPI specifications.

## Features

### 🚀 Mock Server Management
- **Instant Mocking:** Spin up a mock server from any OpenAPI spec with a single click.
- **Secure Authentication:** Automatically generates cryptographically secure API keys (`sk_live_...`) for specs requiring authentication.
- **Redis Integration:** Persists API keys and server state across restarts.
- **Auto-Cleanup:** Automatically cleans up resources and keys when servers are stopped.

### 🔍 API Explorer
- **Interactive Documentation:** Visualize your API endpoints with a clean, modern UI.
- **Request Builder:** Test endpoints directly from the browser.
- **Auto-Injection:** Automatically injects generated API keys into requests when testing authenticated endpoints.
- **Smart Validation:** Visual feedback for API key validation and request formatting.
- **OAuth2 Support:** Simplified OAuth2 testing flow for mock servers.

### 🛠️ SDK Generation
- **Type-Safe SDKs:** Generate fully typed TypeScript SDKs from your OpenAPI specs.
- **Custom Templates:** Uses Handlebars templates for flexible code generation.
- **Enhanced DX:** Generated SDKs include built-in support for authentication, retries, and error handling.

## Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start the development server:**
   ```bash
   pnpm dev
   ```

3. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) to start using Splice.

## Architecture

- **Frontend:** Next.js 15 (App Router), React 19, TailwindCSS, HeroUI.
- **Backend:** Next.js API Routes, Redis (for state management).
- **Mock Engine:** Prism (by Stoplight).
- **Generator:** OpenAPI Generator CLI.

## Development

The project is organized as a monorepo:
- `apps/web`: The main Next.js application.
- `packages/openapi`: Core logic for mock management and SDK generation.

## License

MIT
