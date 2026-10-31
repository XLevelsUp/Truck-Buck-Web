/** Sidebar navigation. Keep in sync with the protected routes in app/router.tsx. */
export const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/bookings", label: "Bookings" },
  { to: "/users", label: "Users" },
  { to: "/transporters", label: "Transporters" },
  { to: "/rates-and-fees", label: "Rates & Fees" },
  { to: "/disputes", label: "Disputes" },
  { to: "/settings", label: "Settings" },
] as const satisfies readonly { to: string; label: string; end?: boolean }[];
