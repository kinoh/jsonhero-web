# React Router v7 migration notes

## Why this migration exists

- `@remix-run/dev@2.17.4` required `wrangler@^3.28.2`, which blocked `npm install` once the app started targeting Wrangler v4.
- React Router v7 is the supported path forward for Remix v2 apps, so the migration removes the install deadlock instead of pinning the platform back down.

## Decisions

- Move the app from Remix config and CLI entrypoints to React Router v7 plus Vite.
- Keep flat route discovery so the existing route file layout continues to work with minimal churn.
- Preserve the worker deployment shape by building the client and server with React Router, then bundling the Cloudflare worker separately.

## Runtime compatibility fixes

- Vite SSR is stricter about CommonJS interop than the previous Remix setup, so CommonJS-heavy dependencies were updated to import through module shapes that work in both dev SSR and production builds.
- CodeMirror-based viewers are now loaded client-side. Their modules touch browser globals during import, so rendering them directly during SSR caused `document is not defined`.
- Document deletion now accepts both `POST` and `DELETE` in the document route action. React Router client forms normalize the non-GET submission to `POST`, so keeping the old `DELETE`-only branch silently broke the delete button.

## Verification

- `npm run build`
- `npm run build:types`
- `npm run test:e2e`
