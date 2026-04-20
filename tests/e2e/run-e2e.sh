#!/usr/bin/env bash
set -euo pipefail

log_file="$(mktemp)"
playwright_browser_name="${PLAYWRIGHT_BROWSER_NAME:-chromium}"
storage_dir="$(mktemp -d)"
server_port="8788"
server_base_url="http://127.0.0.1:${server_port}"

cleanup() {
  pkill -f 'playwright test|npm run start:e2e|npm run start:self-hosted|react-router dev --host 127.0.0.1 --port 8788 --strictPort|node ./server/self-hosted-server.mjs|dev:css|dev:search' >/dev/null 2>&1 || true
  rm -f "$log_file"
  rm -rf "$storage_dir"
}

document_route_ready() {
  local location
  location="$(
    curl -s -o /dev/null -D - 'http://127.0.0.1:8788/new?j=eyJyZWFkaW5lc3MiOnRydWV9' \
      | awk 'BEGIN { IGNORECASE = 1 } /^Location:/ { print $2 }' \
      | tr -d '\r'
  )"

  if [[ -z "$location" ]]; then
    return 1
  fi

  curl -sf "http://127.0.0.1:8788${location}" | grep -q "Name your JSON file"
}

trap cleanup EXIT
cleanup

npx playwright install --only-shell "$playwright_browser_name" >/dev/null
npm run clean >/dev/null
npm run build:css >/dev/null
npx react-router build >/dev/null
npm run build:worker >/dev/null

if [[ "${JSONHERO_DISABLE_OUTBOUND_NETWORK:-0}" == "1" ]]; then
  PORT="$server_port" \
  HOST="127.0.0.1" \
  SESSION_SECRET="e2e-session-secret" \
  JSONHERO_STORAGE_DIR="$storage_dir" \
  JSONHERO_DISABLE_GITHUB_FETCH=1 \
  JSONHERO_DISABLE_OUTBOUND_NETWORK=1 \
  npm run start:self-hosted >"$log_file" 2>&1 &
else
  SESSION_SECRET="e2e-session-secret" \
  JSONHERO_DISABLE_GITHUB_FETCH=1 \
  npm run start:e2e >"$log_file" 2>&1 &
fi

for _ in $(seq 1 90); do
  if curl -sf "$server_base_url" >/dev/null && document_route_ready; then
    npx playwright test --config playwright.config.ts "$@"
    exit $?
  fi

  sleep 1
done

cat "$log_file"
echo "E2E server did not become ready on http://127.0.0.1:8788" >&2
exit 1
