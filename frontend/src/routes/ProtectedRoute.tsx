import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useIdleTimer } from "../hooks/useIdleTimer";

export function ProtectedRoute() {
  const token = useAuthStore((state) => state.accessToken);
  useIdleTimer(); // activa la detección de inactividad solo dentro de rutas protegidas

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}