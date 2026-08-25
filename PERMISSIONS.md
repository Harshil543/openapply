# Permissions Justification

This document explains why each Chrome extension permission is required.

## Required Permissions

| Permission | Why |
|-----------|-----|
| `storage` | Store user profile, job data, and application tracking records locally in the browser. No external storage is used. |
| `activeTab` | Access the current tab to extract job posting data (title, company, description) from supported job boards. |
| `scripting` | Inject content scripts into job posting pages to detect and fill application forms. |
| `sidePanel` | Display the side panel UI for job analysis, application tracking, and AI answer review. |
| `contextMenus` | Add right-click menu options to "Analyze this job" and "Save job" from any page. |
| `alarms` | Periodically check for schema migrations and data integrity (hourly). |

## Host Permissions

| Pattern | Why |
|---------|-----|
| `https://www.linkedin.com/*` | Read job posting data from LinkedIn job pages for analysis and matching. |
| `https://boards.greenhouse.io/*` | Read job posting data from Greenhouse job boards for analysis and matching. |
| `https://jobs.lever.co/*` | Read job posting data from Lever job postings for analysis and matching. |

## What We Don't Do

- We do NOT use `<all_urls>` host permission — only the three job board domains listed above
- We do NOT collect analytics, telemetry, or usage data
- We do NOT send data to any server except the AI provider the user explicitly configures
- We do NOT use cookies or tracking mechanisms
- We do NOT access browsing history or tabs beyond the active tab
