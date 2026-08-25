# OpenApply

A free, privacy-first AI job application Chrome extension.

OpenApply helps you find, score, and prepare job applications — all while keeping your data on your device.

## Features

- **Job Matching** — Deterministic scoring engine analyzes job postings against your profile
- **AI-Powered Analysis** — Optional AI integration via Groq, OpenAI-compatible, or local LLM providers
- **Application Tracker** — Track your applications through the full lifecycle
- **Form Autofill** — Automatically fill application forms with your profile data
- **Privacy-First** — All data stored locally in your browser via chrome.storage.local

## Supported Job Boards

- LinkedIn
- Greenhouse
- Lever

## Quick Start

1. Install the extension from the Chrome Web Store (or load unpacked for development)
2. Complete the onboarding flow to set up your profile
3. Visit a job posting on LinkedIn, Greenhouse, or Lever
4. Click the extension icon or press `Ctrl+Shift+J` to open the side panel
5. Click "Analyze Current Job" to see your match score
6. Save and track your applications

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+J` | Open side panel |
| `Ctrl+Shift+A` | Analyze current job |
| `Ctrl+Shift+F` | Autofill application form |

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
pnpm install
```

### Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm test         # Run tests
pnpm typecheck    # Type check
pnpm lint         # Lint
pnpm zip          # Create zip for Chrome Web Store
```

### Loading Unpacked

1. Run `pnpm build`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `.output/chrome-mv3`

## Tech Stack

- **WXT** — Browser extension framework
- **React 19** — UI
- **TypeScript 7** — Type safety
- **Tailwind CSS 4** — Styling
- **Zod 4** — Schema validation
- **Vitest** — Testing

## AI Configuration

OpenApply supports multiple AI providers. Configure in Settings → AI:

- **Groq** — Fast inference via Groq API (free tier available)
- **OpenAI Compatible** — Any OpenAI-compatible API
- **Local** — Ollama or compatible local LLM
- **Mock** — For testing without an API key

## Privacy

- All profile data is stored locally in your browser
- No data is sent to any server except the AI provider you configure
- No analytics or tracking
- See [PRIVACY.md](PRIVACY.md) for details

## License

MIT — see [LICENSE](LICENSE)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
