import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "./auth-context";

/** Layout route guard: renders child routes only for signed-in users. */
export function RequireAuth() {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}
