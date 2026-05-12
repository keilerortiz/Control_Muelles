import { lazy } from "react";

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
const AppointmentsPage = lazy(() =>
  import("../pages/AppointmentsPage").then((module) => ({ default: module.AppointmentsPage })),
);
const PorteriaPage = lazy(() =>
  import("../pages/PorteriaPage").then((module) => ({ default: module.PorteriaPage })),
);
const SupervisorPage = lazy(() =>
  import("../pages/SupervisorPage").then((module) => ({ default: module.SupervisorPage })),
);

export const routeConfig = {
  public: [{ path: "/login", element: <LoginPage /> }],
  private: [
    { path: "/consultor", element: <ConsultorDashboardPage /> },
    { path: "/admin", element: <AdminMastersPage /> },
    { path: "/planeador", element: <AppointmentsPage title="Planeación de citas" /> },
    { path: "/supervisor", element: <SupervisorPage /> },
    { path: "/portero", element: <PorteriaPage /> },
  ],
  root: <App />,
};
