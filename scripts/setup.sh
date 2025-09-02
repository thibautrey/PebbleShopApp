#!/usr/bin/env bash
# Script to set up Pebble SDK development environment
set -e

# Install system prerequisites (example for Debian/Ubuntu)
if command -v apt >/dev/null 2>&1; then
  sudo apt update
  sudo apt install -y python3 python3-venv python3-pip nodejs npm libsdl1.2debian libfdt1
fi

# Install uv and Pebble CLI
echo "Installing uv and pebble-tool"
pip install --user uv
~/.local/bin/uv tool install pebble-tool

# Install latest Pebble SDK
~/.local/bin/pebble sdk install latest

echo "Environment setup complete"
