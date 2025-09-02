# Pebble Shopify Sales App — Tasks

This is the working task list for the Pebble watch app that displays daily, weekly, and monthly Shopify sales using the Shopify GraphQL/Admin API.

## Milestone 0 — Foundations

- [x] Confirm Pebble SDK and CLI installed (`uv tool install pebble-tool; pebble sdk install latest`).
- [x] Build current scaffold to verify environment (`cd pebble-shop && pebble build`).
- [x] Add `src/pkjs/index.js` with network logic scaffold.
- [x] Define AppMessage `messageKeys` in `pebble-shop/package.json` (e.g., `period`, `total`, `currency`, `status`, `error`).
- [x] Wire watch <-> phone messaging (C AppMessage + pkjs handler).

## Milestone 1 — Shopify Integration

- [x] Decide integration mode:
  - [x] Direct from pkjs (phone-side JavaScript) with Admin API token in settings.
- [x] Implement date range helpers for today/this week/this month (ISO 8601, store timezone).
- [x] Implement GraphQL requests for totals per period.
- [x] Parse totals, normalize currency (shop currency + symbol).
- [x] Basic error handling (auth, rate limits, network timeouts).

Notes:

- pkjs runs on the phone and can make HTTPS requests; avoid embedding long‑lived Admin tokens directly if possible.
- If using a proxy, keep its repo separate; never commit secrets here.

## Milestone 2 — Watch UI

- [x] Replace placeholder text in `src/c/pebble-shop.c` with a simple UI:
  - [x] Show three values (Daily / Weekly / Monthly) or a selectable menu.
  - [x] Loading state while fetching; show last updated time.
  - [x] Error state with retry.
- [x] Map button actions:
  - [x] Up/Down cycle period; Select refresh.

## Milestone 3 — Configuration

- [ ] Implement a Settings page to capture `Store Domain`, `Access Token`, `Timezone` (if not using proxy).
- [ ] Persist settings and validate before requests.
- [ ] Document setup steps in `README.md` (how to obtain token safely).

## Milestone 4 — Quality and DX

- [ ] Add lightweight JS tests for date range and parsing helpers (Node-based, optional).
- [ ] Add CI to build for all targets on PR (GitHub Actions, optional).
- [ ] Add helpful logging in pkjs and guarded `APP_LOG` in C.
- [ ] Performance: cache last results for a short TTL to reduce API calls.

## Milestone 5 — Release

- [ ] Verify on emulator (`pebble install --emulator basalt`).
- [ ] Smoke test on real watch (`pebble install --phone <ip>`).
- [ ] Tag and attach `.pbw` artifact.

## Backlog / Nice-to-Have

- [ ] Auto-refresh on interval while app is open.
- [ ] More metrics (orders count, average order value).
- [ ] Customizable week start (Mon/Sun) and locale-aware currency formatting.
- [ ] Offline display of last known values.

## Work Log

- [ ] Create `tasks.md` and `agent.md` scaffolding.
