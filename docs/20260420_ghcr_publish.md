# GHCR Publishing Decisions

## Why tag pushes publish the Docker image

This fork now has a production-oriented Docker runtime, so release artifacts should be reproducible from Git history instead of depending on a local `docker build` on one machine.

Publishing on `git push --tags` keeps the release contract simple:

- source of truth is the Git tag
- image version is derived from the same tag
- no extra manual release step is required to make the self-hosted image available

## Why the workflow targets GHCR with `GITHUB_TOKEN`

GitHub's container registry integrates directly with repository-scoped packages, and GitHub documents `GITHUB_TOKEN` as the preferred way to authenticate workflow pushes to the container registry.

That keeps the workflow aligned with the repository permissions model and avoids introducing a separate long-lived registry credential.

## Why the workflow generates multiple tags for semver releases

For any pushed tag, the exact Git tag is preserved as an image tag so arbitrary release names still work.

When the pushed tag is semantic versioning, the workflow also emits rolling aliases:

- `major.minor`
- `major`

This gives self-hosting users stable pull targets while keeping pre-1.0 releases conservative by avoiding a floating `0` major alias.
