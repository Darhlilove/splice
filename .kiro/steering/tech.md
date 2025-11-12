# Tech Stack

## Core Framework

- **Next.js 16.0.1** with App Router
- **React 19.2.0** with TypeScript 5
- **pnpm** workspace for package management

## UI & Styling

- **Tailwind CSS 4** with PostCSS
- **HeroUI** (@heroui/react) - Pre-built accessible React components with Framer Motion animations
- **Geist** font family (sans and mono variants)
- Dark mode support built-in

## Key Libraries

- **@apidevtools/swagger-parser** - OpenAPI spec parsing and validation
- **@stoplight/prism-cli** - Mock server generation
- **axios** - HTTP client
- **react-json-tree** - JSON visualization
- **react-syntax-highlighter** - Code syntax highlighting
- **react-aria** - Accessibility primitives

## Development Tools

- **ESLint 9** with Next.js config
- **TypeScript** with strict mode enabled
- Path aliases configured (`@/*` maps to root)

## Common Commands

```bash
# Development
pnpm dev              # Start dev server on localhost:3000

# Build & Deploy
pnpm build            # Production build
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint

# Mock Server (when integrated)
prism mock <spec> -d -p 4010  # Start Prism mock server
```

## TypeScript Configuration

- Target: ES2017
- Strict mode enabled
- JSX: react-jsx (automatic runtime)
- Module resolution: bundler
- Path aliases: `@/*` for root imports

## Deployment

Optimized for Vercel deployment with zero configuration.
