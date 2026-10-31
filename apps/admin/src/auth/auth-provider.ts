import type { ClientId } from "@truckbuck/types";

export type AdminRole = "platform_admin" | "tenant_admin";

export interface Session {
  user: { id: string; name: string; email: string; role: AdminRole };
  accessToken: string;
  /** ISO timestamp. */
  expiresAt: string;
  /** Tenants this admin may act on. */
  tenants: readonly { clientId: ClientId; name: string }[];
}

export interface Credentials {
  email: string;
  password: string;
}

/**
 * Auth backend abstraction. The app only talks to this interface, so swapping
 * the mock for the real NestJS-backed implementation (or an IdP) touches one
 * file: src/app/providers.tsx.
 *
 * Members are function-typed properties (not methods) because they are passed
 * around unbound — to useSyncExternalStore, the api-client, event handlers.
 * Implement them as arrow functions.
 */
export interface AuthProvider {
  /** Synchronous snapshot, for useSyncExternalStore. Must return a stable reference. */
  getSession: () => Session | null;
  signIn: (credentials: Credentials) => Promise<Session>;
  signOut: () => Promise<void>;
  /** Current access token; real implementations refresh here when near expiry. */
  getAccessToken: () => Promise<string | null>;
  subscribe: (listener: () => void) => () => void;
}
