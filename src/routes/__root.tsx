import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "../components/AppShell";

function NotFoundComponent() {
  return (
    <div className="grid-paper flex min-h-screen items-center justify-center bg-background px-4">
      <div className="brutal-border brutal-shadow-lg max-w-md bg-card p-8 text-center">
        <h1 className="font-display text-7xl">404</h1>
        <h2 className="mt-4 text-lg">Page not found</h2>
        <p className="mt-2 font-mono text-xs text-muted-foreground uppercase">
          This route is not part of the scheduler.
        </p>
        <Link
          to="/"
          className="brutal-border mt-6 inline-flex bg-ink px-4 py-2 font-mono text-xs font-bold tracking-wider text-paper uppercase"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="grid-paper flex min-h-screen items-center justify-center bg-background px-4">
      <div className="brutal-border brutal-shadow-lg max-w-md bg-card p-8 text-center">
        <h1 className="text-xl">This page didn't load</h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground uppercase">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="brutal-border bg-ink px-4 py-2 font-mono text-xs font-bold tracking-wider text-paper uppercase"
          >
            Try again
          </button>
          <a
            href="/"
            className="brutal-border bg-card px-4 py-2 font-mono text-xs font-bold tracking-wider uppercase"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Timetable OPT — College Scheduling Lab" },
      {
        name: "description",
        content:
          "Research platform for generating and comparing college timetables using Greedy, Backtracking and Genetic algorithms.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=IBM+Plex+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico", type: "image/x-icon" },
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
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster
        position="top-right"
        toastOptions={{ style: { borderRadius: 0, border: "2px solid #000" } }}
      />
    </QueryClientProvider>
  );
}
