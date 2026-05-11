import App from "../App";
import { AdminMastersPage } from "../pages/AdminMastersPage";
import { ConsultorDashboardPage } from "../pages/ConsultorDashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { AppointmentsPage } from "../pages/AppointmentsPage";
import { PorteriaPage } from "../pages/PorteriaPage";
import { SupervisorPage } from "../pages/SupervisorPage";

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
