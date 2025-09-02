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

- [x] Implement a Settings page to capture `Store Domain`, `Access Token`, `Timezone` (if not using proxy).
- [x] Persist settings and validate before requests.
- [x] Document setup steps in `README.md` (how to obtain token safely).

## Milestone 4 — Quality and DX

 - [x] Performance: cache last results for a short TTL to reduce API calls.

## Backlog / Nice-to-Have

## Milestone 5 — Auto-Refresh

- [ ] Setting: `Auto-refresh interval` (Off, 1m, 5m, 10m, 30m).
- [ ] Implement foreground refresh loop while the app is open (AppTimer on watch + pkjs fetch coordination).
- [ ] Pause timers on app background/exit; resume on foreground.
- [ ] Visual cue for auto mode and update time (e.g., small "Auto" + last updated).
- [ ] Respect Shopify rate limits; minimum 60s between requests and backoff on 429.

## Milestone 6 — Metrics & AOV

- [ ] Fetch order count per period via GraphQL (paid/partially_paid, exclude test/refunds as needed).
- [ ] Compute Average Order Value (AOV = net sales / orders).
- [ ] Extend UI to display metrics (toggle view or per-period detail screen).
- [ ] Add settings to enable/disable extra metrics to save API calls.
- [ ] Update `README.md` with metrics definition caveats.

## Milestone 7 — Week Start & Locale Formatting

- [ ] Setting: `Week starts on` (Mon/Sun) with sane default by locale.
- [ ] Adjust date range helpers to honor week start and store timezone.
- [ ] Locale-aware currency formatting using phone locale (Intl.NumberFormat in pkjs), with fallback.
- [ ] Persist preferences and ensure watch/phone stay in sync.

## Milestone 8 — Offline Last Known

- [ ] Persist last successful totals with timestamp (watch storage + pkjs localStorage).
- [ ] On startup or network error, show cached values with a "stale" indicator and age.
- [ ] Manual refresh action always available; gracefully replace when fresh data arrives.
- [ ] Validate behavior in airplane mode and intermittent connectivity.

## Milestone 9 — Trends & Deltas

- [ ] Cache recent history (e.g., 14 daily points, 8 weekly points).
- [ ] Show trend arrow and percent change vs prior period (DoD: today vs yesterday, week vs last week, month vs last month).
- [ ] Optional compact sparkline on color-capable watches; fallback to arrows/text on B/W.

## Milestone 10 — Goals & Alerts

- [ ] Settings: daily/weekly/monthly sales goals.
- [ ] Highlight when a goal is reached (accent color + haptic pulse).
- [ ] Optional phone-side notification when goals are hit; document permission requirements.

## Milestone 11 — Multi-Store Profiles

- [ ] Support multiple store profiles (domain + token + timezone).
- [ ] Quick switcher on watch; per-profile cached values.
- [ ] Securely store tokens; clear all on profile deletion.

## Work Log

- [ ] Create `tasks.md` and `agent.md` scaffolding.
