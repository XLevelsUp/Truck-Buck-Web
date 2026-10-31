import { createContext, type ReactNode, use, useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { ClientId } from "@truckbuck/types";

import { useAuth } from "@/auth/auth-context";

const STORAGE_KEY = "tb.admin.clientId";

interface TenantContextValue {
  /** Active tenant, or null when signed out / no tenant available. */
  clientId: ClientId | null;
  tenants: readonly { clientId: ClientId; name: string }[];
  setClientId: (clientId: ClientId) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

/**
 * Supplies the active tenant (`clientId`). The api-client reads it for the
 * X-Client-Id header. Switching tenant drops all cached queries so data from
 * one tenant can never render under another.
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [preferred, setPreferred] = useState(() => localStorage.getItem(STORAGE_KEY));

  const tenants = useMemo(() => session?.tenants ?? [], [session]);
  const clientId =
    tenants.find((tenant) => tenant.clientId === preferred)?.clientId ??
    tenants[0]?.clientId ??
    null;

  const setClientId = useCallback(
    (next: ClientId) => {
      localStorage.setItem(STORAGE_KEY, next);
      setPreferred(next);
      queryClient.removeQueries();
    },
    [queryClient],
  );

  const value = useMemo(
    () => ({ clientId, tenants, setClientId }),
    [clientId, tenants, setClientId],
  );
  return <TenantContext value={value}>{children}</TenantContext>;
}

export function useTenant(): TenantContextValue {
  const context = use(TenantContext);
  if (!context) throw new Error("useTenant() must be used inside <TenantProvider>.");
  return context;
}
