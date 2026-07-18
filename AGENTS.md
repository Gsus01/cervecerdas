# AGENTS.md

## Project overview

Cervecerdas is a full-stack beer tracking application written in Spanish. It uses:

- Next.js 16 with the App Router and Route Handlers.
- React 19 and strict TypeScript.
- PostgreSQL with Drizzle ORM.
- Auth.js/NextAuth with JWT sessions.
- Tailwind CSS and local UI components.
- Zod for request and form validation.
- Vitest, Testing Library, and Playwright.

Keep user-facing copy in Spanish unless the task explicitly requires another language.

## Repository structure

- `app/`: pages, layouts, and API Route Handlers.
- `components/`: React components grouped by feature.
- `components/ui/`: shared UI primitives.
- `db/schema.ts`: Drizzle schema and database relations.
- `drizzle/`: versioned SQL migrations and Drizzle metadata.
- `lib/services/`: server-only business and persistence logic.
- `lib/http/`: API client and consistent HTTP error handling.
- `lib/validation/`: shared Zod schemas.
- `lib/types/api.ts`: DTOs shared by server and client.
- `tests/`: Vitest unit, API, and component tests.
- `e2e/`: Playwright browser tests.

## Development commands

Install dependencies with:

```bash
npm install
```

Run the application locally with Docker:

```bash
cp .env.example .env
docker compose up --build
```

Run it without Docker after configuring PostgreSQL:

```bash
npm run db:migrate
npm run dev
```

## Required verification

Run checks appropriate to the change. Before handing off an implementation, prefer the full set:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npx drizzle-kit check
```

Playwright requires a running application and PostgreSQL:

```bash
npm run test:e2e
```

If an environmental dependency prevents a check from running, report the exact blocker. Do not describe an unexecuted check as passing.

## Implementation conventions

- Make the smallest change that fully satisfies the request.
- Match existing naming, formatting, and component patterns.
- Do not refactor unrelated code or overwrite user changes.
- Keep database access and business rules in `lib/services/`.
- Keep Route Handlers thin: authenticate, read input, call a service, and return a response.
- Validate all untrusted request data with Zod.
- Return explicit DTOs; never expose database rows containing private fields.
- Obtain the authenticated user ID from the server session, never from a client-provided ID.
- Use `withErrorHandling` so API errors retain the existing response shape.
- Update `lib/openapi.ts` whenever an API contract changes.
- Update `README.md` when capabilities, setup, routes, or data models materially change.

## Database changes

- Update `db/schema.ts` first.
- Generate a migration with `npm run db:generate`.
- Inspect generated SQL before accepting it. It must be incremental and preserve existing data.
- Never recreate or drop existing tables merely because an old Drizzle snapshot is missing.
- Commit the SQL migration, `_journal.json`, and generated snapshot together.
- Keep new relations nullable when required to preserve legacy rows; enforce stricter rules for new writes in the service or validation layer.

## UI and accessibility

- Reuse semantic color tokens and components from `components/ui/`.
- Design mobile-first and avoid horizontal overflow at 375 px.
- Keep interactive targets at least 44 px high.
- Give every form field a visible associated label.
- Place validation errors next to their field and expose them to assistive technology.
- Preserve visible keyboard focus and logical focus order.
- Use Lucide icons rather than emoji or ad-hoc icon systems.
- Provide loading, empty, success, and error feedback for asynchronous flows.
- Respect `prefers-reduced-motion` and avoid decorative continuous animation.
- Use `next/image` for raster images when practical and reserve image dimensions to prevent layout shift.

## Testing expectations

- Add or update service tests for business and transactional behavior.
- Add API tests for authentication, validation, and session-derived identity.
- Add component tests for meaningful user interactions and error states.
- Update Playwright flows when a required step changes.
- Tests should verify observable behavior rather than implementation details.

## Git and pull requests

- Do not commit `.env`, credentials, generated test reports, or local build artifacts.
- Use focused commits with conventional messages such as `feat:`, `fix:`, or `test:`.
- Include `Closes #<issue>` in a PR description when the PR should close an issue after merge.
