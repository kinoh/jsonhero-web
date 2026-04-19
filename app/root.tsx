import {
  Links,
  Meta,
  Outlet,
  ScrollRestoration,
  UNSAFE_DataRouterContext as DataRouterContext,
  UNSAFE_DataRouterStateContext as DataRouterStateContext,
  UNSAFE_FrameworkContext as FrameworkContext,
  useLoaderData,
  useLocation,
} from "react-router";
import clsx from "clsx";
import { useContext, useEffect, useMemo } from "react";
import {
  NonFlashOfWrongThemeEls,
  Theme,
  ThemeProvider,
  useTheme,
} from "~/components/ThemeProvider";

import openGraphImage from "~/assets/images/opengraph.png";

export const meta = ({
  location,
}: {
  location: Location;
}) => {
  const description =
    "JSON Hero makes reading and understand JSON files easy by giving you a clean and beautiful UI packed with extra features.";
  return [
    { title: "JSON Hero - a beautiful JSON viewer for the web" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { name: "description", content: description },
    { property: "og:image", content: `https://jsonhero.io${openGraphImage}` },
    { property: "og:url", content: `https://jsonhero.io${location.pathname}` },
    { property: "og:title", content: "JSON Hero - A beautiful JSON viewer" },
    { property: "og:description", content: description },
    { name: "twitter:image", content: `https://jsonhero.io${openGraphImage}` },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:creator", content: "@json_hero" },
    { name: "twitter:site", content: "@json_hero" },
    { name: "twitter:title", content: "JSON Hero" },
    { name: "twitter:description", content: description },
  ];
};

import styles from "./tailwind.css?url";
import { getThemeSession } from "./theme.server";
import { getStarCount } from "./services/github.server";
import { StarCountProvider } from "./components/StarCountProvider";
import { PreferencesProvider } from "~/components/PreferencesProvider";

export const links = () => {
  return [{ rel: "stylesheet", href: styles }];
};

export type LoaderData = {
  theme?: Theme;
  starCount?: number;
  themeOverride?: Theme;
};

let hasDocumentHydrated = false;

export const loader = async ({
  request,
}: {
  request: Request;
}) => {
  const themeSession = await getThemeSession(request);
  const starCount = await getStarCount();
  const themeOverride = getThemeFromRequest(request);

  const data: LoaderData = {
    theme: themeSession.getTheme(),
    starCount,
    themeOverride,
  };

  return data;
};

function getThemeFromRequest(request: Request): Theme | undefined {
  const url = new URL(request.url);
  const theme = url.searchParams.get("theme");
  if (theme) {
    return theme as Theme;
  }
  return undefined;
}

function getActiveMatches(
  matches: Array<{ route: { id: string } }>,
  errors: Record<string, unknown> | null | undefined,
  isSpaMode: boolean
) {
  if (isSpaMode && !hasDocumentHydrated) {
    return [matches[0]];
  }

  if (errors) {
    const errorIndex = matches.findIndex((match) => errors[match.route.id] !== undefined);
    return matches.slice(0, errorIndex + 1);
  }

  return matches;
}

function DocumentScripts() {
  const frameworkContext = useContext(FrameworkContext) as any;
  const dataRouterContext = useContext(DataRouterContext) as any;
  const routerState = useContext(DataRouterStateContext) as any;

  useEffect(() => {
    hasDocumentHydrated = true;
  }, []);

  const initialScripts = useMemo(() => {
    if (!frameworkContext || !dataRouterContext || !routerState || hasDocumentHydrated) {
      return null;
    }

    const {
      manifest,
      serverHandoffString,
      isSpaMode,
      renderMeta,
      routeDiscovery,
    } = frameworkContext;
    const { router, static: isStatic, staticContext } = dataRouterContext;

    if (renderMeta) {
      renderMeta.didRenderScripts = true;
    }

    const matches = getActiveMatches(routerState.matches, routerState.errors, isSpaMode);
    const enableFogOfWar = routeDiscovery.mode === "lazy" && frameworkContext.ssr === true;
    const streamScript =
      'window.__reactRouterContext.stream = new ReadableStream({start(controller){window.__reactRouterContext.streamController = controller;}}).pipeThrough(new TextEncoderStream());';
    const contextScript = staticContext
      ? `window.__reactRouterContext = ${serverHandoffString};${streamScript}`
      : " ";
    const routeModulesScript = !isStatic
      ? " "
      : `${manifest.hmr?.runtime ? `import ${JSON.stringify(manifest.hmr.runtime)};` : ""}${!enableFogOfWar ? `import ${JSON.stringify(manifest.url)};` : ""};
${matches
  .map((match: { route: { id: string } }, routeIndex: number) => {
    const routeVarName = `route${routeIndex}`;
    const manifestEntry = manifest.routes[match.route.id];

    if (!manifestEntry) {
      throw new Error(`Route ${match.route.id} not found in manifest`);
    }

    const {
      clientActionModule,
      clientLoaderModule,
      clientMiddlewareModule,
      hydrateFallbackModule,
      module,
    } = manifestEntry;

    const chunks = [
      ...(clientActionModule
        ? [{ module: clientActionModule, varName: `${routeVarName}_clientAction` }]
        : []),
      ...(clientLoaderModule
        ? [{ module: clientLoaderModule, varName: `${routeVarName}_clientLoader` }]
        : []),
      ...(clientMiddlewareModule
        ? [{ module: clientMiddlewareModule, varName: `${routeVarName}_clientMiddleware` }]
        : []),
      ...(hydrateFallbackModule
        ? [{ module: hydrateFallbackModule, varName: `${routeVarName}_HydrateFallback` }]
        : []),
      { module, varName: `${routeVarName}_main` },
    ];

    if (chunks.length === 1) {
      return `import * as ${routeVarName} from ${JSON.stringify(module)};`;
    }

    const chunkImportsSnippet = chunks
      .map((chunk) => `import * as ${chunk.varName} from "${chunk.module}";`)
      .join("\n");
    const mergedChunksSnippet = `const ${routeVarName} = {${chunks
      .map((chunk) => `...${chunk.varName}`)
      .join(",")}};`;

    return [chunkImportsSnippet, mergedChunksSnippet].join("\n");
  })
  .join("\n")}
  window.__reactRouterRouteModules = {${matches
    .map((match: { route: { id: string } }, index: number) => `${JSON.stringify(match.route.id)}:route${index}`)
    .join(",")}};

import(${JSON.stringify(manifest.entry.module)});`;
    const sri = typeof manifest.sri === "object" ? manifest.sri : {};

    return (
      <>
        {typeof manifest.sri === "object" ? (
          <script
            rr-importmap=""
            type="importmap"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                integrity: sri,
              }),
            }}
          />
        ) : null}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: contextScript }}
        />
        <script
          type="module"
          async
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: routeModulesScript }}
        />
      </>
    );
  }, [dataRouterContext, frameworkContext, routerState]);

  return initialScripts;
}

function App() {
  const [theme] = useTheme();

  return (
    <html lang="en" className={clsx(theme)}>
      <head>
        <Meta />
        <meta charSet="utf-8" />
        <Links />
        <NonFlashOfWrongThemeEls ssrTheme={Boolean(theme)} />
      </head>
      <body className="overscroll-none">
        <Outlet />
        <ScrollRestoration />
        <DocumentScripts />
      </body>
    </html>
  );
}

export default function AppWithProviders() {
  const { theme, starCount, themeOverride } = useLoaderData<LoaderData>();

  const location = useLocation();

  // Force dark mode on the homepage
  const forceDarkMode = location.pathname === "/";

  return (
    <ThemeProvider
      specifiedTheme={theme}
      themeOverride={forceDarkMode ? "dark" : themeOverride}
    >
      <PreferencesProvider>
        <StarCountProvider starCount={starCount}>
          <App />
        </StarCountProvider>
      </PreferencesProvider>
    </ThemeProvider>
  );
}
