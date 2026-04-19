import { createCookieSessionStorage } from "@remix-run/cloudflare";
import type { Session } from "@remix-run/cloudflare";
import { getSessionSecret } from "~/environment.server";

export type ToastMessage = {
  message: string;
  title: string;
  type: "success" | "error";
  id: string;
};

const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

function getToastStorage() {
  return createCookieSessionStorage({
    cookie: {
      name: "__message",
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: ONE_YEAR,
      secrets: [getSessionSecret()],
      secure: true,
    },
  });
}

export function getSession(cookieHeader?: string | null) {
  return getToastStorage().getSession(cookieHeader);
}

export function commitSession(session: Session) {
  return getToastStorage().commitSession(session);
}

export function setSuccessMessage(
  session: Session,
  message: string,
  title: string
) {
  session.flash("toastMessage", {
    message,
    title,
    type: "success",
    id: crypto.randomUUID(),
  });
}

export function setErrorMessage(
  session: Session,
  message: string,
  title: string
) {
  session.flash("toastMessage", {
    message,
    title,
    type: "error",
    id: crypto.randomUUID(),
  });
}
