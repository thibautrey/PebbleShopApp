# Agent Guide — Pebble Shopify Sales App

This document explains how agents (and future contributors) should work in this repository using Codex CLI. Keep changes minimal, focused, and verifiable.

## Repo Overview

- Watch app: C code in `pebble-shop/src/c/` built with Pebble SDK 3.
- Phone JS (pkjs): to be added in `pebble-shop/src/pkjs/index.js` for network calls and AppMessage handling.
- Build system: Waf via `pebble-shop/wscript`; app metadata in `pebble-shop/package.json`.
- Current state: app shows placeholder text and button handlers; network/pkjs not yet scaffolded.

## How We Work (with Codex CLI)

- Prefer small, surgical patches. Use `apply_patch`; do not `git commit` unless explicitly requested.
- For multi-step work, use the plan tool (`update_plan`) to outline and track steps.
- Before running commands, send a brief preamble of intent. Request approval for commands that need elevated permissions or network.
- Validate locally when practical:
  - Build: `cd pebble-shop && pebble build`
  - Emulator: `pebble install --emulator basalt`
- Keep documentation current when behavior changes (`README.md`, `tasks.md`).

## Coding Conventions

- C (watch app):
  - Keep functions short; favor explicit state over globals when possible.
  - Use Pebble AppMessage for communication. Guard logs with appropriate levels.
  - UI should remain responsive: show loading and error states.
- JavaScript (pkjs):
  - Single entry `src/pkjs/index.js` listening for AppMessage requests.
  - Use `fetch`/`XMLHttpRequest` as supported in PebbleKit JS environment.
  - Centralize date/time helpers and currency formatting.
- Message keys:
  - Define in `pebble-shop/package.json` under `pebble.messageKeys`.
  - After editing keys, run a build to regenerate auto headers for C and JS.

## AppMessage Protocol (proposed)

- Outgoing (C → pkjs): `{ period: "day" | "week" | "month" }`
- Incoming (pkjs → C): `{ period, total, currency, status: "ok" }` or `{ status: "error", error }`

## Security & Secrets

- Do not commit API tokens. If integrating directly with Shopify Admin API from pkjs, add a Settings page to input/store the token on-device.
- Prefer a minimal proxy service (separate repo) to avoid distributing Admin tokens; if adding such code here, guard with `.env` and add entries to `.gitignore`.

## When Modifying the Build

- Keep `wscript` and `package.json` changes minimal. Ensure `enableMultiJS` remains true if pkjs is used.
- Do not add new build tools or formatters unless requested.

## Testing & CI

- Manual testing via emulator is acceptable initially.
- Optional: add lightweight Node tests for pkjs helpers (date ranges, parsing). Do not add heavy frameworks.
- If adding CI, prefer a simple GitHub Actions workflow that runs `pebble build` for all target platforms.

## PR/Change Hygiene

- One logical change per patch. Update `tasks.md` to reflect progress.
- Call out any follow-ups or limitations in the final message.

## Quick Start (Agent)

1) Scaffold pkjs and message keys.
2) Implement C AppMessage request/response handling and UI states.
3) Implement Shopify calls in pkjs and parse totals.
4) Build and test on emulator.
5) Update docs and tasks.

