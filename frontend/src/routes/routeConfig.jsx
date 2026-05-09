import App from "../App";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { AppointmentsPage } from "../pages/AppointmentsPage";

export const routeConfig = {
  public: [{ path: "/login", element: <LoginPage /> }],
  private: [
    { path: "/dashboard", element: <DashboardPage /> },
    { path: "/appointments", element: <AppointmentsPage /> },
  ],
  root: <App />,
};
