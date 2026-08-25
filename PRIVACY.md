# Privacy Policy

**OpenApply** — AI Job Application Chrome Extension

## Overview

OpenApply is designed with privacy as a core principle. All your data stays on your device.

## Data Storage

All user data is stored locally in your browser using `chrome.storage.local`. This includes:

- Profile information (name, email, skills, experience)
- Job postings you've analyzed or saved
- Application tracking records
- AI provider configuration

No data is stored on external servers controlled by OpenApply.

## Data Transmission

- **AI Provider**: If you configure an AI provider (Groq, OpenAI-compatible, or local), job descriptions and profile context are sent to that provider for analysis. You choose which provider to use.
- **No Analytics**: OpenApply does not collect analytics, telemetry, or usage data.
- **No Tracking**: OpenApply does not use cookies, pixels, or any tracking mechanisms.
- **No Third-Party Sharing**: Your data is never sold, shared, or transmitted to third parties.

## Page Content Access

OpenApply reads visible page content on job posting sites (LinkedIn, Greenhouse, Lever) to extract job information such as title, company, location, and required skills. This data is processed locally and is not transmitted anywhere unless you have configured an AI provider.

## Permissions

- `storage` — Store your profile and application data locally
- `activeTab` — Access the current tab for job extraction
- `scripting` — Inject content scripts for form detection and autofill
- `sidePanel` — Display the side panel UI
- `contextMenus` — Right-click menu options

## Data Deletion

You can delete all your data at any time from Settings → Privacy → Delete All Data. This permanently removes all profile information, saved jobs, and application records from your browser.

## Changes to This Policy

If this privacy policy is updated, the changes will be reflected in the extension's source code and Chrome Web Store listing.

## Contact

For questions about this privacy policy, open an issue at the project's GitHub repository.
