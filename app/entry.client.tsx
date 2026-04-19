import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { load } from "fathom-client";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});

load("ROBFNTET", {
  spa: "history",
  excludedDomains: ["localhost"],
  includedDomains: ["jsonhero.io"],
});
