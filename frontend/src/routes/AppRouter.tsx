import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { DefaultPrivateRedirect } from "./DefaultPrivateRedirect";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";
import { routeConfig } from "./routeConfig";
import type { PrivateRoutePath } from "../domain/types/routes";

const privateRouteByPath = Object.fromEntries(
  routeConfig.private.map((route) => [route.path, route.element]),
) as Record<PrivateRoutePath, JSX.Element>;

export function AppRouter() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-neutral-500">Cargando...</div>}>
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
              <Route path="/consultor" element={privateRouteByPath["/consultor"]} />
              <Route path="/consultor/citas" element={<Navigate to="/consultor" replace />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/admin" element={privateRouteByPath["/admin"]} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["PLANEADOR", "ADMIN"]} />}>
              <Route path="/planeador" element={privateRouteByPath["/planeador"]} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["SUPERVISOR", "ADMIN"]} />}>
              <Route path="/supervisor" element={privateRouteByPath["/supervisor"]} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["SUPERVISOR", "PLANEADOR", "CONSULTOR", "ADMIN"]} />}>
              <Route path="/vista-operativa-muelles" element={privateRouteByPath["/vista-operativa-muelles"]} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["PORTERIA", "ADMIN"]} />}>
              <Route path="/portero" element={privateRouteByPath["/portero"]} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
