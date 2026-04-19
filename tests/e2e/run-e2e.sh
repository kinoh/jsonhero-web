#!/usr/bin/env bash
set -euo pipefail

log_file="$(mktemp)"

cleanup() {
  pkill -f 'playwright test|npm run start:e2e|wrangler dev --config wrangler.toml --port 8788 --assets public|remix watch|dev:css|dev:search|dev:worker' >/dev/null 2>&1 || true
  rm -f "$log_file"
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

npm run clean >/dev/null
npx remix build >/dev/null
npm run build:worker >/dev/null

JSONHERO_DISABLE_GITHUB_FETCH=1 npm run start:e2e >"$log_file" 2>&1 &

for _ in $(seq 1 90); do
  if curl -sf http://127.0.0.1:8788 >/dev/null && document_route_ready; then
    exec npx playwright test --config playwright.config.ts "$@"
  fi

  sleep 1
done

cat "$log_file"
echo "E2E server did not become ready on http://127.0.0.1:8788" >&2
exit 1
