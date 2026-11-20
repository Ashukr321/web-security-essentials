# Next.js Template 2k26

A production-ready Next.js starter template with authentication scaffolding, validation, testing, and modern tooling pre-configured.

## Tech Stack

| Category         | Technology                         |
| ---------------- | ---------------------------------- |
| Framework        | Next.js 16 (App Router)            |
| Language         | TypeScript 5                       |
| Styling          | Tailwind CSS 4                     |
| Data Fetching    | TanStack React Query 5             |
| HTTP Client      | Axios                              |
| Validation       | Zod                                |
| Unit Testing     | Vitest + Testing Library           |
| Linting          | ESLint 9 (flat config)             |
| Git Hooks        | Husky (lint + typecheck on commit) |
| PWA              | Web App Manifest                   |
| Containerization | Docker                             |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth route group (login, register, forgot/reset password)
│   ├── (dashboard)/         # Dashboard route group
│   ├── layout.tsx           # Root layout with providers
│   ├── error.tsx            # Global error boundary
│   ├── loading.tsx          # Global loading state
│   └── not-found.tsx        # 404 page
├── components/
│   ├── auth/                # Auth-specific components
│   ├── common/              # Shared/reusable components
│   ├── dashboard/           # Dashboard-specific components
│   └── ui/                  # Base UI primitives
├── context/                 # React context providers
├── hooks/                   # Custom React hooks
├── mocks-data/              # Mock data for development/testing
├── providers/               # App-level providers (React Query, etc.)
├── react-query/             # Query keys, hooks, and mutations
├── skeletons/               # Loading skeleton components
├── store/                   # Client-side state management
├── tests/
│   ├── unit/                # Unit tests (Vitest)
│   ├── integration/         # Integration tests (configure runner)
│   └── e2e/                 # End-to-end tests (configure runner)
├── utils/                   # Utility functions and API client
└── validations/             # Zod schemas and sanitization helpers
```

## Getting Started

### Prerequisites

- Node.js (see `.nvmrc` for version)
- npm

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd nextjs-template-2k26

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Post-Clone: Exclude Local Folders

After cloning this template for a new project, uncomment these lines in `.gitignore` to stop tracking local-only folders:

```gitignore
# project docs (local only — uncomment after cloning template)
/project-docs

# todo notes (local only — uncomment after cloning template)
/.todo
```

These folders are tracked in the template repo so the structure ships with it. Once you start a real project, exclude them so each developer's notes stay local.

### Environment Variables

See [`.env.example`](.env.example) for all available variables:

| Variable               | Description          | Default                     |
| ---------------------- | -------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL`  | Backend API base URL | `http://localhost:8000/api` |
| `NEXT_PUBLIC_APP_NAME` | Application name     | `MyApp`                     |
| `NEXT_PUBLIC_APP_URL`  | Frontend URL         | `http://localhost:3000`      |

## Scripts

| Command                       | Description                              |
| ----------------------------- | ---------------------------------------- |
| `npm run dev`                 | Start development server                 |
| `npm run build`               | Create production build                  |
| `npm run start`               | Start production server                  |
| `npm run lint`                | Run ESLint                               |
| `npm run typecheck`           | Run TypeScript type checking             |
| `npm run test:unit`           | Run unit tests (Vitest)                  |
| `npm run test:unit:watch`     | Run unit tests in watch mode             |
| `npm run test:unit:coverage`  | Run unit tests with coverage report      |
| `npm run test:integration`    | Run integration tests (configure runner) |
| `npm run test:e2e`            | Run e2e tests (configure runner)         |

## Testing

Unit tests use **Vitest** with **Testing Library** and live in `src/tests/unit/`. Mirror the source folder structure:

```
src/validations/auth.ts       → src/tests/unit/validations/auth.test.ts
src/utils/apiClient.ts        → src/tests/unit/utils/apiClient.test.ts
src/hooks/useDebounce.ts      → src/tests/unit/hooks/useDebounce.test.ts
```

```bash
# Run unit tests
npm run test:unit

# Watch mode
npm run test:unit:watch

# With coverage
npm run test:unit:coverage
```

Integration and e2e test scripts are placeholders — configure your preferred runner (Playwright, Cypress, etc.) when needed.

> See [`setup.md`](setup.md) for detailed testing guide with examples.

## Validation

Zod schemas live in `src/validations/` and are form-library-agnostic. Use them with any form library or manually:

```ts
import { loginSchema, sanitizeInput } from "@/validations";

// With any form library
const result = loginSchema.safeParse({ email, password });

// Sanitize user input at trust boundaries
const clean = sanitizeInput(rawInput);
```

Password policy: 8-128 characters, must include uppercase, lowercase, number, and special character.

## Security Headers

Pre-configured in [`next.config.ts`](next.config.ts) → `headers()`, applied to all routes.

| Header | Value | Purpose | When to change |
|--------|-------|---------|----------------|
| `X-DNS-Prefetch-Control` | `on` | Enables DNS prefetching for faster external links | Set to `off` to disable prefetching |
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking protection — blocks cross-origin iframes | Change to `DENY` to block all framing. Remove if you need cross-origin embedding (use CSP `frame-ancestors` instead) |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing attacks | Generally keep as-is |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer info sent with requests | Options: `no-referrer`, `origin`, `strict-origin`, `unsafe-url` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` | Disables unused browser features | Add/remove features: `payment=()`, `usb=()`, `autoplay=()`, `fullscreen=(self)` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS for 2 years with preload | Lower `max-age` during testing (e.g. `86400` for 1 day). Remove `preload` before submitting to hstspreload.org. Only enable on production domains with valid SSL |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter for older browsers | Remove when you add a CSP header (modern browsers use CSP instead) |

### Adding Content Security Policy (CSP)

CSP is the strongest XSS protection. Add it to `next.config.ts` headers array when ready:

```ts
{ key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://your-api.com;" }
```

Start restrictive, loosen as needed. Test in `Content-Security-Policy-Report-Only` mode first.

## Git Hooks

Pre-configured via Husky:

- **pre-commit** — runs `lint` and `typecheck`
- **commit-msg** — enforces [Conventional Commits](https://www.conventionalcommits.org/) format (`type(scope): description`)

Supported types: `feat`, `fix`, `hotfix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `structure`, `revert`

## Project Documentation

Internal project docs live in `project-docs/` at the root with templates for:

| Folder                       | Purpose                              |
| ---------------------------- | ------------------------------------ |
| `project-docs/requirements/` | PRD, feature specs, user stories     |
| `project-docs/architecture/` | ADRs and system design decisions     |
| `project-docs/api/`          | API contracts and endpoint docs      |
| `project-docs/design/`       | UI/UX specs, wireframes, tokens      |
| `project-docs/meetings/`     | Meeting notes and decisions          |
| `project-docs/runbooks/`     | Deployment and operational playbooks |
| `project-docs/changelog/`    | Internal changelog and release notes |

> See [`project-docs/README.md`](project-docs/README.md) for full structure and usage.

## Docker

```bash
docker compose up
```

> Dockerfile and docker-compose.yml are scaffolded — configure for your deployment target.

## License

MIT
