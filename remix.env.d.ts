/// <reference types="@react-router/dev" />
/// <reference types="@cloudflare/workers-types" />

import "react-router";

declare module "react-router" {
  interface AppLoadContext {
    waitUntil(promise: Promise<unknown>): void;
  }
}

declare module "*.mdx" {
  const Component: (props: Record<string, unknown>) => JSX.Element;
  type RouteExport = (...args: any[]) => any;

  export default Component;
  export const links: RouteExport | undefined;
  export const meta: RouteExport | undefined;
}

export {};
