import { Navigate, Outlet } from "react-router-dom";
import type { RoleCode } from "../domain/types/auth";

import { getDefaultRouteForRoles } from "../domain/roleNavigation";
import { useAuthStore } from "../store/authStore";

interface RoleRouteProps {
  allowedRoles?: RoleCode[];
}

export function RoleRoute({ allowedRoles = [] }: RoleRouteProps) {
  const roles = useAuthStore((state) => state.user?.roles || []);
  const hasAccess = allowedRoles.some((role) => roles.includes(role));

  if (!hasAccess) {
    return <Navigate to={getDefaultRouteForRoles(roles)} replace />;
  }

  return <Outlet />;
}
