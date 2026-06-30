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
          Esta ubicación no figura en ningún registro del Continental.
        </p>
        <a href="/" className="inline-block mt-6 text-xs tracking-[0.25em] uppercase text-gold border border-gold-dim px-5 py-2 hover:bg-gold hover:text-primary-foreground transition">
          Regresar al Vestíbulo
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
        <p className="text-destructive text-xs tracking-[0.3em] uppercase">Señal Perdida</p>
        <h1 className="font-display text-3xl text-gold mt-3">Transmisión Fallida</h1>
        <p className="mt-3 text-sm text-muted-foreground">La línea está comprometida. Restablezca el canal seguro.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 text-xs tracking-[0.25em] uppercase text-gold border border-gold-dim px-5 py-2 hover:bg-gold hover:text-primary-foreground transition"
        >
          Reintentar Enlace
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
      { title: "Intranet Continental — Sub Rosa" },
      { name: "description", content: "Portal clasificado para miembros. Solo personal autorizado." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Intranet Continental" },
      { property: "og:description", content: "Sub Rosa. Solo por invitación." },
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
    <html lang="es">
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
