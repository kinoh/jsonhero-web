# E2E Safety Net Before Dependency Refresh

## Context

The repository had only utility-focused Jest tests and very little coverage around Remix routes, document creation flows, and Cloudflare worker integration.

At the same time, the codebase is old enough that dependency refresh work is likely to touch routing, document persistence, and view navigation. That made route-level regressions more likely than utility regressions.

## Decision

We added a small happy-path Playwright suite before broader dependency refresh work.

The suite intentionally focuses on high-value flows instead of exhaustive assertions:

- create a document from pasted JSON
- create a document from an uploaded file
- create a document from a remote JSON URL
- rename a document
- navigate across document views
- verify the persisted JSON through the `.json` endpoint
- delete a document

## Why This Scope

This scope protects the application seams most likely to break during framework or dependency changes:

- Remix actions and loaders
- Cloudflare worker request handling
- document persistence and retrieval
- view navigation wiring

We avoided brittle visual assertions and preferred accessible locators plus API-level verification where the UI presents repeated values in multiple regions.

## Supporting Changes

Two small supporting changes were made to keep E2E deterministic:

- local and test environments no longer fetch the GitHub star count
- document view navigation links now expose accessible labels for resilient Playwright locators

## Consequences

The suite is not broad enough to replace unit tests, but it creates a practical release gate for future dependency and routing work.
