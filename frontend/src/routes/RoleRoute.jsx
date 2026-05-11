import { Navigate, Outlet } from "react-router-dom";

import { getDefaultRouteForRoles } from "../domain/roleNavigation";
import { useAuthStore } from "../store/authStore";

export function RoleRoute({ allowedRoles = [] }) {
  const roles = useAuthStore((state) => state.user?.roles || []);
  const hasAccess = allowedRoles.some((role) => roles.includes(role));

  if (!hasAccess) {
    return <Navigate to={getDefaultRouteForRoles(roles)} replace />;
  }

  return <Outlet />;
}
