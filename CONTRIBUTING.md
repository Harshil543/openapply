# Contributing to OpenApply

Thanks for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Run `pnpm install`
4. Create a feature branch: `git checkout -b my-feature`
5. Make your changes
6. Run `pnpm test` and `pnpm typecheck` to verify
7. Commit your changes
8. Push to your fork and open a pull request

## Development Commands

```bash
pnpm dev          # Start dev server with hot reload
pnpm build        # Build for production
pnpm test         # Run unit test suite
pnpm test:watch   # Run tests in watch mode
pnpm test:e2e     # Run E2E tests (requires built extension)
pnpm typecheck    # Type check
pnpm lint         # Lint (tsc --noEmit)
```

## Code Guidelines

- Use TypeScript for all new code
- Follow existing code style and patterns
- Add tests for new features
- Keep changes focused — one feature/fix per PR
- Update documentation if needed

## Project Structure

```
entrypoints/     # Browser extension entry points
  background.ts  # Service worker
  content/       # Content scripts
  popup/         # Extension popup
  options/       # Options page
  sidepanel/     # Side panel
  onboarding/    # First-run experience
lib/             # Shared libraries
  schemas/       # Zod validation schemas
  storage/       # Chrome storage layer
  ai/            # AI provider abstraction
  matching/      # Job matching engine
  autofill/      # Form detection and filling
  messaging/     # Typed message bus
tests/           # Test files
```

## Testing

### Unit Tests

Tests use Vitest with jsdom. Run the full suite before submitting:

```bash
pnpm test
```

### E2E Tests

E2E tests use Playwright to load the built extension in a real Chromium browser.

```bash
pnpm build          # Build first (E2E tests need the built extension)
pnpm test:e2e       # Run E2E tests
pnpm test:e2e:headed # Run with visible browser
```

## CI

GitHub Actions runs on every push/PR to `main`:

1. Type check (`tsc --noEmit`)
2. Unit tests (Vitest)
3. Production build (WXT)

E2E tests are not run in CI due to Chrome extension loading limitations, but can be run locally.

## Reporting Issues

Open an issue on GitHub with:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/OS version
