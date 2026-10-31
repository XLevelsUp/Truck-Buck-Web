import { createContext, type ReactNode, use, useMemo, useSyncExternalStore } from "react";

import type { AuthProvider, Credentials, Session } from "./auth-provider";

interface AuthContextValue {
  provider: AuthProvider;
  session: Session | null;
  signIn: (credentials: Credentials) => Promise<Session>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthContextProvider({
  provider,
  children,
}: {
  provider: AuthProvider;
  children: ReactNode;
}) {
  const session = useSyncExternalStore(provider.subscribe, provider.getSession);
  const value = useMemo(
    () => ({ provider, session, signIn: provider.signIn, signOut: provider.signOut }),
    [provider, session],
  );
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext);
  if (!context) throw new Error("useAuth() must be used inside <AuthContextProvider>.");
  return context;
}
