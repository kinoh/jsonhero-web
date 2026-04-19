# E2E Browser Provisioning

## Context

The Playwright suite was reliable on developer machines that already had browser binaries installed, but that assumption does not hold for clean CI runners.

Since Playwright 1.38+, `@playwright/test` no longer downloads browser binaries during `npm install`. A fresh environment therefore needs an explicit install step before running the suite.

## Decision

We now provision Chromium explicitly in two places:

- `tests/e2e/run-e2e.sh` installs the headless Chromium shell before booting the app, so `npm run test:e2e` is self-contained on clean machines.
- `.github/workflows/main.yml` installs Chromium with OS dependencies before invoking the E2E suite, matching Playwright's CI guidance.

## Why

This keeps the test entrypoint deterministic across local and CI execution:

- local runs no longer depend on a previously warmed Playwright cache
- CI failures surface actual application regressions instead of missing browser setup
- the workflow now enforces the E2E safety net that was already added to the repository
