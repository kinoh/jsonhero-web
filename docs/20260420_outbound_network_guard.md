# Outbound Network Guard

## Why a startup-level guard was added

Self-hosted deployments need a single switch that prevents accidental outbound HTTP(S) access regardless of which route or service triggers it. Scattering `if` checks across individual features would leave too much room for regressions when new fetch call sites are added.

`JSONHERO_DISABLE_OUTBOUND_NETWORK=1` now enables a runtime fetch guard in both the Node self-hosted server and the Cloudflare worker entrypoint. The guard allows loopback addresses for local development infrastructure and rejects non-local outbound HTTP(S) requests before they leave the process.

## Why preview and GitHub star count are disabled explicitly

The fetch guard is the safety net, but preview and GitHub star count also short-circuit intentionally when outbound access is disabled. That keeps user-facing behavior predictable, avoids noisy error logging, and makes the disabled mode an intentional product configuration rather than a series of transport-level failures.
