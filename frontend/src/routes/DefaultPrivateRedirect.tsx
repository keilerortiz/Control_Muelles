import { Navigate } from "react-router-dom";

import { getDefaultRouteForRoles } from "../domain/roleNavigation";
import { useAuthStore } from "../store/authStore";

export function DefaultPrivateRedirect() {
  const roles = useAuthStore((state) => state.user?.roles || []);
  return <Navigate to={getDefaultRouteForRoles(roles)} replace />;
}
