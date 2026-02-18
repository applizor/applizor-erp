#!/bin/bash

# Applizor ERP Development Starter
# This script launches the development environment with hot-reloading enabled.

echo "🚀 Starting Applizor ERP [DEVELOPMENT MODE]..."
echo "----------------------------------------------"

# Ensure we are in the root directory
cd "$(dirname "$0")"

# Start the dev environment
docker-compose -f docker-compose.dev.yml up --build

# Note: Hot-reloading is enabled via host volumes.
# Changes to /backend or /frontend will be reflected instantly.
