import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { RemixBrowser } from "@remix-run/react";
import { load } from "fathom-client";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});

load("ROBFNTET", {
  spa: "history",
  excludedDomains: ["localhost"],
  includedDomains: ["jsonhero.io"],
});
