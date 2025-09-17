# Jira AI Comment Helper

Chrome/Edge Manifest V3 extension that adds an "AI draft comment" button to Jira Cloud issues. It reads the issue title/description and recent thread, then drafts a concise, human-sounding reply using your OpenAI API key (default model: `gpt-5`).

## Features
- AI-assisted comment drafting directly on Jira issue pages
- Grabs recent thread, detects latest question for you, and writes a focused reply
- Options page to set your name, OpenAI API key, and default model
- Lightweight: no build step — load the `src/` folder as an unpacked extension

## Quick Start (Chrome/Edge)

Prerequisites
- OpenAI API key with access to a chat model (e.g., `gpt-5`)
- Chrome 114+ or Microsoft Edge (Chromium)
- Jira Cloud domain access

Install
1) Download or clone this repository.
2) Open `chrome://extensions` (or `edge://extensions`).
3) Enable "Developer mode" (toggle in top-right).
4) Click "Load unpacked" and select the `src/` folder of this repo.

Configure
- Open the extension’s Options: in `chrome://extensions` → "Jira AI Comment Helper" → "Extension options", or right‑click the extension icon → "Options".
- Fill in:
  - Your Name: used to detect questions addressed to you
  - OpenAI API Key
  - Default Model (e.g., `gpt-5`)
- Click "Save settings".

Use
- Navigate to a Jira issue on your domain.
- Click the "AI draft comment" button near the issue header.
- A draft comment is generated and inserted into the Jira editor. If the editor isn’t detected, the draft is copied to your clipboard.
- Review, tweak if needed, and post.

## Change Jira Domain

By default, the extension is scoped to `pariplayltd.atlassian.net`. Update these fields to use your Jira Cloud domain and then reload the extension in `chrome://extensions`:
- Update content script match: `src/manifest.json:17`
  - Replace `https://pariplayltd.atlassian.net/*` with your domain, e.g., `https://yourcompany.atlassian.net/*`.
- Update host permissions: `src/manifest.json:8`
  - Replace the same URL there as well.
- Optional (CSP for extension pages): `src/manifest.json:12`
  - If you keep Atlassian listed in `connect-src`, update it to your domain or remove it.

After edits, click the "Reload" button for the extension in `chrome://extensions`.

## Models

- Default is `gpt-5`. You can set any chat model your OpenAI account has access to (e.g., `gpt-5`, `gpt-5-mini`). If you see a 404/Forbidden response, verify model name and access.

## Troubleshooting

- Button not visible: ensure you’re on the configured Jira domain and viewing an issue page; refresh the tab; verify the extension is loaded from `src/` and enabled.
- "Missing OpenAI key": open Options and set your API key.
- 401 Unauthorized: check the API key.
- 403 Forbidden: your key may not have access to the chosen model.
- 404 Model not found: verify the exact model name and access.
- 429 Rate limit/quota: wait or switch to a lighter model; the extension retries once automatically and surfaces rate-limit hints when available.
- Editor not found: the draft is copied to clipboard; paste manually.

## Privacy & Data

- The prompt sent to OpenAI includes: issue key/title, description (if present), a small recent thread excerpt, and your name. The code lightly redacts obvious emails and long token-like strings before sending.
- Your settings are stored locally via `chrome.storage.sync`.
- No data is sent anywhere else by this extension.

## Development

- Source lives in `src/`. There is no build step.
- To iterate: edit files under `src/`, then click "Reload" for the extension in `chrome://extensions` and refresh your Jira tab.
- Files of interest:
  - Manifest: `src/manifest.json`
  - Background (OpenAI calls): `src/background.js`
  - Content script (UI injection): `src/content.js`
  - Options page: `src/options.html`, `src/options.js`, `src/options.css`

## License

MIT — see `LICENSE`.
