import {
  Links,
  Meta,
  Outlet,
  ScrollRestoration,
  Scripts,
  useLoaderData,
  useLocation,
} from "react-router";
import clsx from "clsx";
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
import { isOutboundNetworkDisabled } from "./environment.server";
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
  outboundNetworkDisabled: boolean;
};

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
    outboundNetworkDisabled: isOutboundNetworkDisabled(),
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

function App() {
  const [theme] = useTheme();

  return (
    <html lang="en" className={clsx(theme)}>
      <head>
        <meta charSet="utf-8" />
        <Meta />
        <Links />
        <NonFlashOfWrongThemeEls ssrTheme={Boolean(theme)} />
        <Scripts />
      </head>
      <body className="overscroll-none">
        <Outlet />
        <ScrollRestoration />
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
