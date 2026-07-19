#!/bin/bash

# -------------------------
# Configuration
# -------------------------
CONTAINER="car-rental-db"

# -------------------------
# Cleanup Function
# -------------------------
cleanup() {
    echo ""
    echo "Stopping development environment..."

    # Stop Next.js
    if [[ -n "$DEV_PID" ]]; then
        kill "$DEV_PID" 2>/dev/null
        wait "$DEV_PID" 2>/dev/null
    fi

    echo "Stopping Docker container..."
    docker stop "$CONTAINER" >/dev/null

    echo "Closing Docker Desktop..."
    osascript -e 'quit app "Docker"'

    echo "Done."
    exit 0
}

trap cleanup SIGINT SIGTERM

# -------------------------
# Start Docker Desktop
# -------------------------
if ! docker info >/dev/null 2>&1; then
    echo "Starting Docker Desktop..."
    open -a Docker

    echo "Waiting for Docker..."
    until docker info >/dev/null 2>&1; do
        sleep 2
    done
fi

echo "Docker is ready."

# -------------------------
# Start Database
# -------------------------
docker start "$CONTAINER" >/dev/null

# -------------------------
# Open PostgreSQL in a new Terminal
# -------------------------
osascript <<EOF
tell application "Terminal"
    do script "docker exec -it $CONTAINER psql -U postgres -d car_rental"
    activate
end tell
EOF

# -------------------------
# Run Next.js
# -------------------------
echo "Starting Next.js..."
pnpm run dev &
DEV_PID=$!

# Wait until Ctrl+C
wait "$DEV_PID"
cleanup