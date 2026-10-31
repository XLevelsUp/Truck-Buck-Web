import { createContext, type ReactNode, use, useMemo } from "react";

import { type ApiClient, createApiClient } from "@truckbuck/api-client";

import { useAuth } from "@/auth/auth-context";
import { env } from "@/env";
import { useTenant } from "@/tenant/tenant-context";

const ApiClientContext = createContext<ApiClient | null>(null);

/**
 * Builds the api-client from the current auth provider and tenant. Recreated
 * when the tenant changes, so a request can never carry a stale X-Client-Id.
 */
export function ApiClientProvider({ children }: { children: ReactNode }) {
  const { provider } = useAuth();
  const { clientId } = useTenant();

  const client = useMemo(
    () =>
      createApiClient({
        baseUrl: env.VITE_API_BASE_URL,
        getAccessToken: provider.getAccessToken,
        getClientId: () => clientId,
        onUnauthorized: () => void provider.signOut(),
      }),
    [provider, clientId],
  );

  return <ApiClientContext value={client}>{children}</ApiClientContext>;
}

/** Use inside query/mutation functions: `useApiClient().get("/bookings")`. */
export function useApiClient(): ApiClient {
  const client = use(ApiClientContext);
  if (!client) throw new Error("useApiClient() must be used inside <ApiClientProvider>.");
  return client;
}
