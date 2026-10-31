import { createBrowserRouter, type RouteObject } from "react-router";

import { RequireAuth } from "@/auth/require-auth";
import { AppShell } from "@/layouts/app-shell";
import { NotFoundPage } from "@/routes/not-found";
import { RouteErrorBoundary } from "@/routes/route-error-boundary";

/**
 * Route table. Every page is lazy-loaded into its own chunk; the shell, guard
 * and error/404 views are eager so they render instantly.
 */
export const routes: RouteObject[] = [
  {
    path: "/",
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        path: "login",
        lazy: { Component: async () => (await import("@/routes/login")).LoginPage },
      },
      {
        Component: RequireAuth,
        children: [
          {
            Component: AppShell,
            children: [
              {
                index: true,
                lazy: { Component: async () => (await import("@/routes/dashboard")).DashboardPage },
              },
              {
                path: "bookings",
                lazy: { Component: async () => (await import("@/routes/bookings")).BookingsPage },
              },
              {
                path: "users",
                lazy: { Component: async () => (await import("@/routes/users")).UsersPage },
              },
              {
                path: "transporters",
                lazy: {
                  Component: async () => (await import("@/routes/transporters")).TransportersPage,
                },
              },
              {
                path: "rates-and-fees",
                lazy: {
                  Component: async () => (await import("@/routes/rates-and-fees")).RatesAndFeesPage,
                },
              },
              {
                path: "disputes",
                lazy: { Component: async () => (await import("@/routes/disputes")).DisputesPage },
              },
              {
                path: "settings",
                lazy: { Component: async () => (await import("@/routes/settings")).SettingsPage },
              },
              { path: "*", Component: NotFoundPage },
            ],
          },
        ],
      },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
