import { createCookieSessionStorage } from "@remix-run/cloudflare";

import { Theme, isTheme } from "~/components/ThemeProvider";
import { getSessionSecret } from "~/environment.server";

function getThemeStorage() {
  return createCookieSessionStorage({
    cookie: {
      name: "theme-cookie",
      secure: true,
      secrets: [getSessionSecret()],
      sameSite: "lax",
      path: "/",
      httpOnly: true,
    },
  });
}

async function getThemeSession(request: Request) {
  const themeStorage = getThemeStorage();
  const session = await themeStorage.getSession(request.headers.get("Cookie"));
  return {
    getTheme: () => {
      const themeValue = session.get("theme");
      return isTheme(themeValue) ? themeValue : "dark";
    },
    setTheme: (theme: Theme) => session.set("theme", theme),
    commit: () => themeStorage.commitSession(session),
  };
}

export { getThemeSession };
