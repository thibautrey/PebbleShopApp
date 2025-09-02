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
