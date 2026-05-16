import { lazy } from "react";
import type { RouteConfig } from "../domain/types/routes";

import App from "../App";

const AdminMastersPage = lazy(() =>
  import("../pages/AdminMastersPage").then((module) => ({ default: module.AdminMastersPage })),
);
const ConsultorDashboardPage = lazy(() =>
  import("../pages/ConsultorDashboardPage").then((module) => ({ default: module.ConsultorDashboardPage })),
);
const LoginPage = lazy(() =>
  import("../pages/LoginPage").then((module) => ({ default: module.LoginPage })),
);
const PorteriaPage = lazy(() =>
  import("../pages/PorteriaPage").then((module) => ({ default: module.PorteriaPage })),
);
const AppointmentsPage = lazy(() =>
  import("../pages/AppointmentsPage").then((module) => ({ default: module.AppointmentsPage })),
);
const DockLiveViewPage = lazy(() =>
  import("../pages/DockLiveViewPage").then((module) => ({ default: module.DockLiveViewPage })),
);

export const routeConfig: RouteConfig = {
  public: [{ path: "/login", element: <LoginPage /> }],
  private: [
    { path: "/consultor", element: <ConsultorDashboardPage /> },
    { path: "/admin", element: <AdminMastersPage /> },
    { path: "/planeador", element: <AppointmentsPage title="Planeación de citas" /> },
    { path: "/supervisor", element: <AppointmentsPage title="Supervisión de patio" /> },
    { path: "/portero", element: <PorteriaPage /> },
    { path: "/vista-operativa-muelles", element: <DockLiveViewPage /> },
  ],
  root: <App />,
};
