import {
  data,
  redirect,
} from "react-router";
import { getThemeSession } from "~/theme.server";
import { isTheme } from "~/components/ThemeProvider";
import { sendEvent } from "~/graphJSON.server";

export const action = async ({
  request,
  context,
}: {
  request: Request;
  context: { waitUntil(promise: Promise<unknown>): void };
}) => {
  const themeSession = await getThemeSession(request);
  const requestText = await request.text();
  const form = new URLSearchParams(requestText);
  const theme = form.get("theme");

  if (!isTheme(theme)) {
    return data({
      success: false,
      message: `theme value of ${theme} is not a valid theme`,
    });
  }

  themeSession.setTheme(theme);

  context.waitUntil(
    sendEvent({
      type: "set-theme",
      theme,
    })
  );

  return data(
    { success: true },
    { headers: { "Set-Cookie": await themeSession.commit() } }
  );
};

export const loader = () => redirect("/", { status: 404 });
