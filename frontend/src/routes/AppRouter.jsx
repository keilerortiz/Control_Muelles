import { Navigate, Route, Routes } from "react-router-dom";

import { DefaultPrivateRedirect } from "./DefaultPrivateRedirect";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";
import { routeConfig } from "./routeConfig.jsx";

export function AppRouter() {
  return (
    <Routes>
      {routeConfig.public.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      <Route element={<ProtectedRoute />}>
        <Route element={routeConfig.root}>
          <Route index element={<DefaultPrivateRedirect />} />
          <Route path="/dashboard" element={<DefaultPrivateRedirect />} />
          <Route path="/appointments" element={<DefaultPrivateRedirect />} />

          <Route element={<RoleRoute allowedRoles={["CONSULTOR", "ADMIN"]} />}>
            <Route path="/consultor" element={routeConfig.private.find((route) => route.path === "/consultor")?.element} />
          </Route>

          <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={routeConfig.private.find((route) => route.path === "/admin")?.element} />
          </Route>

          <Route element={<RoleRoute allowedRoles={["PLANEADOR", "ADMIN"]} />}>
            <Route path="/planeador" element={routeConfig.private.find((route) => route.path === "/planeador")?.element} />
          </Route>

          <Route element={<RoleRoute allowedRoles={["SUPERVISOR", "ADMIN"]} />}>
            <Route path="/supervisor" element={routeConfig.private.find((route) => route.path === "/supervisor")?.element} />
          </Route>

          <Route element={<RoleRoute allowedRoles={["PORTERIA", "ADMIN"]} />}>
            <Route path="/portero" element={routeConfig.private.find((route) => route.path === "/portero")?.element} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
