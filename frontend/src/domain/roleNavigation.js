import { BarChart3, CalendarClock, ClipboardList, ShieldCheck, SlidersHorizontal } from "lucide-react";

export const roleRoutes = {
  CONSULTOR: "/consultor",
  ADMIN: "/admin",
  PLANEADOR: "/planeador",
  SUPERVISOR: "/supervisor",
  PORTERIA: "/portero",
};

export const roleNavigationItems = [
  {
    to: "/consultor",
    label: "Consultoría",
    Icon: BarChart3,
    roles: ["CONSULTOR", "ADMIN"],
  },
  {
    to: "/admin",
    label: "Maestros",
    Icon: SlidersHorizontal,
    roles: ["ADMIN"],
  },
  {
    to: "/planeador",
    label: "Planeación",
    Icon: CalendarClock,
    roles: ["PLANEADOR", "ADMIN"],
  },
  {
    to: "/supervisor",
    label: "Supervisión",
    Icon: ShieldCheck,
    roles: ["SUPERVISOR", "ADMIN"],
  },
  {
    to: "/portero",
    label: "Portería",
    Icon: ClipboardList,
    roles: ["PORTERIA", "ADMIN"],
  },
];

export function getDefaultRouteForRoles(roles = []) {
  if (roles.includes("ADMIN")) return "/admin";
  if (roles.includes("CONSULTOR")) return "/consultor";
  if (roles.includes("PLANEADOR")) return "/planeador";
  if (roles.includes("SUPERVISOR")) return "/supervisor";
  if (roles.includes("PORTERIA")) return "/portero";
  return "/login";
}

export function getRouteLabel(pathname) {
  const currentItem = roleNavigationItems.find((item) => pathname.startsWith(item.to));
  return currentItem?.label || "Operación";
}
