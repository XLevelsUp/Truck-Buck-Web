import type { ClientId } from "@truckbuck/types";

import type { AuthProvider, Credentials, Session } from "./auth-provider";

const STORAGE_KEY = "tb.admin.session";

// Fixture ids are trusted literals; casting avoids pulling zod into the entry chunk.
const DEMO_TENANT = "tenant_demo" as ClientId;
const ACME_TENANT = "tenant_acme" as ClientId;

/**
 * Development-only auth: accepts any well-formed credentials and keeps the
 * session in sessionStorage. Makes no network calls.
 */
export class MockAuthProvider implements AuthProvider {
  private session: Session | null;
  private readonly listeners = new Set<() => void>();
  private readonly storage: Storage | undefined;

  constructor(storage: Storage | undefined = globalThis.sessionStorage) {
    this.storage = storage;
    this.session = this.restore();
  }

  getSession = (): Session | null => this.session;

  getAccessToken = (): Promise<string | null> => Promise.resolve(this.session?.accessToken ?? null);

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  signIn = async (credentials: Credentials): Promise<Session> => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const session: Session = {
      user: {
        id: "usr_mock_admin",
        name: credentials.email.split("@")[0] ?? "Admin",
        email: credentials.email,
        role: "platform_admin",
      },
      accessToken: `mock.${crypto.randomUUID()}`,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      tenants: [
        { clientId: DEMO_TENANT, name: "Demo Logistics" },
        { clientId: ACME_TENANT, name: "Acme Freight" },
      ],
    };
    this.update(session);
    return session;
  };

  signOut = (): Promise<void> => {
    this.update(null);
    return Promise.resolve();
  };

  private update(session: Session | null): void {
    this.session = session;
    if (session) this.storage?.setItem(STORAGE_KEY, JSON.stringify(session));
    else this.storage?.removeItem(STORAGE_KEY);
    for (const listener of this.listeners) listener();
  }

  private restore(): Session | null {
    const raw = this.storage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as Session;
      return Date.parse(session.expiresAt) > Date.now() ? session : null;
    } catch {
      return null;
    }
  }
}
