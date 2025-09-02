# Pebble Shopify Sales App

This project contains a Pebble watch application that displays daily, weekly and monthly sales for a Shopify store using the Shopify GraphQL API.

## Development Environment Setup

Follow these steps to prepare your environment:

### 1. Install prerequisites

- Python 3
- Node.js and npm
- [uv](https://github.com/astral-sh/uv) for managing the Pebble CLI

On Ubuntu for example:

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm libsdl1.2debian libfdt1
pip install uv
```

On macOS (Homebrew):

```bash
# Xcode Command Line Tools (if not installed)
xcode-select --install

# Install prerequisites
brew update
brew install python node uv sdl2 dtc
```

Notes (macOS):

- If `uv` is not available via Homebrew, install with: `python3 -m pip install --user uv`.
- Ensure your PATH includes `~/.local/bin` when installing `uv` with `pip`.

### 2. Install Pebble CLI and SDK

```bash
uv tool install pebble-tool
pebble sdk install latest
```

### 3. Create and build a Pebble project

```bash
pebble new-project pebble-shop
cd pebble-shop
pebble build
```

### 4. Run the app on an emulator or device

```bash
# Emulator (Basalt as an example)
pebble install --emulator basalt

# Real watch
pebble install --phone <phone-ip>
```

Refer to the [CoreDevices SDK documentation](https://github.com/coredevices/sdk-docs) for detailed usage and additional information.

## App Configuration

Open the app settings from the Pebble mobile app. The settings page captures:

- Store Domain: your Shopify domain, e.g. `my-shop.myshopify.com` (no `https://`).
- Admin API Access Token: a token with `read_orders` scope.
- Timezone Offset: optional `+HH:MM` or `-HH:MM` to align date ranges with your store timezone. Defaults to the phone’s timezone.

After saving, the watch app requests totals again. If settings are incomplete, pkjs returns stub values so you can still verify the UI.

## Performance & Caching

- The phone-side script (pkjs) caches the last totals per period for a short TTL (about 2 minutes) in `localStorage` to reduce Shopify API calls.
- If a cached value is fresh, the app serves it immediately without a network request.
- Saving new settings clears the cache.

## Getting a Shopify Admin API Token (safely)

1. In Shopify Admin, go to Settings → Apps and sales channels → Develop apps.
2. Create a new custom app (or use an existing one) and configure Admin API scopes.
3. Enable at least: `read_orders`.
4. Install the app to your store and copy the Admin API access token.

Security notes:

- Treat the token as a secret. Do not commit it to the repo.
- For production, consider using a minimal proxy service to avoid embedding long‑lived tokens on devices. This repo supports direct-from-pkjs for simplicity, but a proxy is recommended for tighter control and auditability.
