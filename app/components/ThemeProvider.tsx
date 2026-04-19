import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useFetcher } from "react-router";

export type Theme = "dark" | "light";

type ThemeContextType = [
  Theme | undefined,
  Dispatch<SetStateAction<Theme | undefined>>
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const prefersLightMQ = "(prefers-color-scheme: light)";
const getPreferredTheme = () =>
  window.matchMedia(prefersLightMQ).matches ? "light" : "dark";

export function ThemeProvider({
  children,
  specifiedTheme,
  themeOverride,
}: {
  children: ReactNode;
  specifiedTheme?: Theme;
  themeOverride?: Theme;
}) {
  const [theme, setTheme] = useState<Theme | undefined>(() => {
    if (specifiedTheme) {
      if (specifiedTheme === "light" || specifiedTheme === "dark") {
        return specifiedTheme;
      } else {
        return;
      }
    }

    return;
  });

  useEffect(() => {
    if (specifiedTheme || themeOverride || theme) {
      return;
    }

    setTheme(getPreferredTheme());
  }, [specifiedTheme, themeOverride, theme]);

  const mountRun = useRef(false);
  const persistTheme = useFetcher();

  useEffect(() => {
    if (!mountRun.current) {
      mountRun.current = true;
      return;
    }

    if (!theme) {
      return;
    }

    persistTheme.submit(
      { theme },
      { action: "actions/setTheme", method: "post" }
    );
  }, [theme]);

  return (
    <ThemeContext.Provider value={[themeOverride ?? theme, setTheme]}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

const clientThemeCode = `
;(() => {
  const theme = window.matchMedia(${JSON.stringify(prefersLightMQ)}).matches
    ? 'light'
    : 'dark';
  const cl = document.documentElement.classList;
  const themeAlreadyApplied = cl.contains('light') || cl.contains('dark');
  if (themeAlreadyApplied) {
    // this script shouldn't exist if the theme is already applied!
    console.warn(
      "Hi there, could you let us know you're seeing this message? Thanks!",
    );
  } else {
    cl.add(theme);
  }
})();
`;

export function NonFlashOfWrongThemeEls({ ssrTheme }: { ssrTheme: boolean }) {
  return (
    <>
      {ssrTheme ? null : (
        <script dangerouslySetInnerHTML={{ __html: clientThemeCode }} />
      )}
    </>
  );
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && ["light", "dark"].includes(value);
}
