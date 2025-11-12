# Project Structure

## Directory Organization

```
splice/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with fonts and metadata
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles and Tailwind directives
│   └── favicon.ico        # Site favicon
├── public/                # Static assets
│   ├── test-specs/        # Sample OpenAPI specs for testing
│   │   ├── Petstore openapi.yaml
│   │   ├── Stripe spec3.yaml
│   │   └── twilio_accounts_v1.{json,yaml}
│   └── *.svg              # UI icons and logos
├── notes/                 # Project documentation
│   ├── About Project.md   # Detailed implementation guide
│   └── Kiroween Hackathon 14 Day Plan.md
├── .kiro/                 # Kiro IDE configuration
│   └── steering/          # AI assistant steering rules
├── node_modules/          # Dependencies (pnpm)
└── [config files]         # Root-level configuration
```

## Configuration Files

- `package.json` - Dependencies and scripts
- `pnpm-workspace.yaml` - pnpm workspace configuration
- `tsconfig.json` - TypeScript compiler options
- `next.config.ts` - Next.js configuration
- `eslint.config.mjs` - ESLint rules
- `postcss.config.mjs` - PostCSS/Tailwind setup

## Architectural Patterns

### App Router Structure

- Use Next.js App Router conventions (app directory)
- Server Components by default, Client Components when needed
- API routes in `app/api/` when backend logic is required

### Component Organization

- Co-locate components with their routes when route-specific
- Shared components should go in `app/components/` (create as needed)
- Use HeroUI components for UI primitives

### Styling Conventions

- Tailwind utility classes for styling
- HeroUI components provide base styling and animations
- Dark mode support via Tailwind's `dark:` variant
- Custom CSS in `globals.css` for global overrides only

### Type Safety

- Strict TypeScript enabled
- Define types for OpenAPI schemas and API responses
- Use TypeScript interfaces for component props
- Leverage path aliases (`@/*`) for clean imports

## Future Structure (Planned)

When implementing the three core features:

```
app/
├── explorer/          # Schema Explorer component
├── mock/              # Mock Server UI and controls
├── sdk/               # SDK Generator interface
├── api/               # API routes for backend logic
│   ├── parse/         # OpenAPI parsing endpoint
│   ├── mock/          # Mock server management
│   └── generate/      # SDK generation endpoint
└── components/        # Shared UI components
```

## Test Specs Location

Sample OpenAPI specifications for development and testing are stored in `public/test-specs/`:

- Petstore (simple example)
- Stripe (complex real-world API)
- Twilio (both JSON and YAML formats)

Use these for testing parsing, mock generation, and SDK generation features.
