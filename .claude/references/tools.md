# CLI Tools Reference

Claude Code reads this file to know which CLI tools are available and how to use them. When a command fails because a tool is missing, check this file for the install command and offer to install it.

## How This File Works

- Each tool entry includes: install command, version check, and common usage.
- Claude Code should check `<tool> --version` before assuming a tool is available.
- If a tool is missing and needed, ask the user before installing.

## Universal Tools

### Git
- **Check:** `git --version`
- **Usage:** Version control. Always available.

### Node.js / npm
- **Check:** `node --version && npm --version`
- **Install:** https://nodejs.org or `nvm install --lts`
- **Usage:** `npm install`, `npm run <script>`, `npx <command>`

## Project-Specific Tools

### TypeScript
- **Check:** `npx tsc --version`
- **Install:** `npm i -D typescript`
- **Usage:** `npx tsc --noEmit` (type checking)

### esbuild
- **Check:** `npx esbuild --version`
- **Install:** `npm i -D esbuild`
- **Usage:** `node esbuild.js` (extension bundling), `node esbuild.js --watch`

### Vite
- **Check:** `cd webview-ui && npx vite --version`
- **Install:** `cd webview-ui && npm install`
- **Usage:** `cd webview-ui && npm run build` (webview bundling)

### vsce (VS Code Extension CLI)
- **Check:** `npx vsce --version`
- **Install:** `npm i -g @vscode/vsce`
- **Usage:** `vsce package` (create .vsix), `vsce publish` (publish to marketplace)

### ESLint
- **Check:** `npx eslint --version`
- **Install:** `npm i -D eslint`
- **Usage:** `npm run lint` (lint src/)

## Stack-Specific Tools

### Linters & Formatters
| Tool | Check | Install | Use When |
|------|-------|---------|----------|
| eslint | `npx eslint --version` | `npm i -D eslint` | JS/TS linting |
| prettier | `npx prettier --version` | `npm i -D prettier` | JS/TS/CSS/MD formatting |
| biome | `npx biome --version` | `npm i -D @biomejs/biome` | Fast JS/TS lint + format |

### Test Runners
| Tool | Check | Install | Use When |
|------|-------|---------|----------|
| vitest | `npx vitest --version` | `npm i -D vitest` | Vite-based JS/TS projects |
| jest | `npx jest --version` | `npm i -D jest` | JS/TS testing |
| playwright | `npx playwright --version` | `npm i -D @playwright/test` | E2E browser testing |

### Build Tools
| Tool | Check | Install | Use When |
|------|-------|---------|----------|
| vite | `npx vite --version` | `npm i -D vite` | Frontend builds |
| esbuild | `npx esbuild --version` | `npm i -D esbuild` | Fast JS bundling |
| tsc | `npx tsc --version` | `npm i -D typescript` | TypeScript compilation |

## Available MCP Servers

Claude Code has access to the following MCP (Model Context Protocol) servers. These provide direct integration with external services without needing CLI tools.

### GitHub MCP

| MCP Server | Purpose |
|------------|---------|
| **github** | Full GitHub integration: repos, issues, PRs, branches, commits, code search, releases, reviews |

### Communication & Productivity MCPs

| MCP Server | Purpose |
|------------|---------|
| **claude_ai_Slack** | Read/search channels, send messages, create canvases, search users |
| **claude_ai_Gmail** | Search/read emails, create drafts, get profile |
| **claude_ai_Google_Calendar** | List/create/update events, find free time, RSVP |
| **claude_ai_Notion** | Search/create/update pages and databases, query views, manage comments |

### Notion MCP (Direct)

| MCP Server | Purpose |
|------------|---------|
| **notion** | Direct Notion API: search, create/update pages, query databases, manage comments |

### Browser Automation MCP

| MCP Server | Purpose |
|------------|---------|
| **claude-in-chrome** | Chrome browser automation: navigate, click, type, read pages, take screenshots, record GIFs, execute JS |

### IT Management MCPs

| MCP Server | Purpose |
|------------|---------|
| **ninjaone** | RMM/endpoint management: devices, organizations, tickets, patches, scripts, alerts |
| **zendesk** | Help desk: tickets, users, organizations, triggers, automations, macros, views |
