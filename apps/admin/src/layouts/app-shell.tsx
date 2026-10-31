import { NavLink, Outlet } from "react-router";

import { Badge } from "@truckbuck/ui/badge";
import { Button } from "@truckbuck/ui/button";
import { cn } from "@truckbuck/ui/lib/utils";

import { useAuth } from "@/auth/auth-context";
import { env } from "@/env";
import { navItems } from "@/lib/nav";
import { useTenant } from "@/tenant/tenant-context";

export function AppShell() {
  return (
    <div className="grid min-h-dvh grid-cols-1 md:grid-cols-[15rem_1fr]">
      <Sidebar />
      <div className="flex min-w-0 flex-col">
        <TopBar />
        <main id="main" className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="border-b bg-card md:border-r md:border-b-0">
      <div className="flex h-14 items-center gap-2 border-b px-4 font-bold">
        <span
          aria-hidden="true"
          className="grid size-7 place-items-center rounded-md bg-primary text-xs text-primary-foreground"
        >
          TB
        </span>
        TruckBuck Admin
      </div>
      <nav aria-label="Main" className="p-2">
        <ul className="flex gap-1 overflow-x-auto md:flex-col">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={"end" in item ? item.end : false}
                className={({ isActive }) =>
                  cn(
                    "block rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    isActive && "bg-secondary text-secondary-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

function TopBar() {
  const { session, signOut } = useAuth();
  const { clientId, tenants, setClientId } = useTenant();

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-card px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <label htmlFor="tenant" className="text-sm text-muted-foreground">
          Tenant
        </label>
        <select
          id="tenant"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={clientId ?? ""}
          onChange={(event) => {
            const next = tenants.find((tenant) => tenant.clientId === event.target.value);
            if (next) setClientId(next.clientId);
          }}
        >
          {tenants.map((tenant) => (
            <option key={tenant.clientId} value={tenant.clientId}>
              {tenant.name}
            </option>
          ))}
        </select>
        {env.VITE_APP_ENV === "production" ? null : (
          <Badge variant="warning">{env.VITE_APP_ENV}</Badge>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm sm:inline">{session?.user.name}</span>
        <Button variant="outline" size="sm" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
