import { Outlet, createRootRoute } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";

import { Providers } from "#/app/providers";
import "../styles.css";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <Providers>
      <NuqsAdapter>
        <Outlet />
      </NuqsAdapter>
    </Providers>
  );
}

