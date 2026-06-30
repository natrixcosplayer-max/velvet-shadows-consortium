import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-mono">
      <div className="max-w-md text-center noir-panel gold-corners p-10">
        <p className="text-gold-dim text-xs tracking-[0.3em] uppercase">Error 404</p>
        <h1 className="font-display text-5xl text-gold mt-3">Locus Ignotus</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          This location is not on any Continental ledger.
        </p>
        <a href="/" className="inline-block mt-6 text-xs tracking-[0.25em] uppercase text-gold border border-gold-dim px-5 py-2 hover:bg-gold hover:text-primary-foreground transition">
          Return to Lobby
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-mono">
      <div className="max-w-md text-center noir-panel gold-corners p-10">
        <p className="text-destructive text-xs tracking-[0.3em] uppercase">Signal Lost</p>
        <h1 className="font-display text-3xl text-gold mt-3">Transmission Failed</h1>
        <p className="mt-3 text-sm text-muted-foreground">The line is compromised. Re-establish secure channel.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 text-xs tracking-[0.25em] uppercase text-gold border border-gold-dim px-5 py-2 hover:bg-gold hover:text-primary-foreground transition"
        >
          Retry Handshake
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Continental Intranet — Sub Rosa" },
      { name: "description", content: "Classified members-only portal. Authorized personnel only." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Continental Intranet" },
      { property: "og:description", content: "Sub Rosa. By invitation only." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500&family=Inter:wght@300;400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
