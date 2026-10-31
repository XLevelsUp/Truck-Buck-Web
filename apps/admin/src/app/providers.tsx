import { lazy, type ReactNode, Suspense, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@truckbuck/ui/toaster";

import { ApiClientProvider } from "@/api/api-context";
import { AuthContextProvider } from "@/auth/auth-context";
import type { AuthProvider } from "@/auth/auth-provider";
import { MockAuthProvider } from "@/auth/mock-auth-provider";
import { TenantProvider } from "@/tenant/tenant-context";

import { createQueryClient } from "./query-client";

// Devtools are loaded only in dev; `import.meta.env.DEV` is a build-time
// constant, so production bundles do not contain them at all.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools })),
    )
  : () => null;

interface AppProvidersProps {
  children: ReactNode;
  /** Injectable for tests. Defaults to the mock until the real API exists. */
  authProvider?: AuthProvider;
}

export function AppProviders({ children, authProvider }: AppProvidersProps) {
  const [queryClient] = useState(createQueryClient);
  const [auth] = useState<AuthProvider>(() => authProvider ?? new MockAuthProvider());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider provider={auth}>
        <TenantProvider>
          <ApiClientProvider>
            <Toaster>{children}</Toaster>
          </ApiClientProvider>
        </TenantProvider>
      </AuthContextProvider>
      <Suspense>
        <ReactQueryDevtools buttonPosition="bottom-left" />
      </Suspense>
    </QueryClientProvider>
  );
}
