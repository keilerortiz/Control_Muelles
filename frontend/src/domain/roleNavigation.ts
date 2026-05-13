import { BarChart3, CalendarClock, ClipboardList, MonitorDot, ShieldCheck, SlidersHorizontal } from "lucide-react";
import type React from "react";
import type { RoleCode } from "./types/auth";

export const roleRoutes: Record<string, string> = {
  CONSULTOR: "/consultor",
  ADMIN: "/admin",
  PLANEADOR: "/planeador",
  SUPERVISOR: "/supervisor",
  PORTERIA: "/portero",
};

export const roleNavigationItems: Array<{
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  roles: RoleCode[];
}> = [
  {
    to: "/consultor",
    label: "Consultoría",
    Icon: BarChart3,
    roles: ["CONSULTOR", "ADMIN"],
  },
  {
    to: "/consultor/citas",
    label: "Citas (consulta)",
    Icon: CalendarClock,
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
    to: "/vista-operativa-muelles",
    label: "Tiempo real muelles",
    Icon: MonitorDot,
    roles: ["SUPERVISOR", "PLANEADOR", "CONSULTOR", "ADMIN"],
  },
  {
    to: "/portero",
    label: "Portería",
    Icon: ClipboardList,
    roles: ["PORTERIA", "ADMIN"],
  },
];

export function getDefaultRouteForRoles(roles: RoleCode[] = []) {
  if (roles.includes("ADMIN")) return "/admin";
  if (roles.includes("CONSULTOR")) return "/consultor";
  if (roles.includes("PLANEADOR")) return "/planeador";
  if (roles.includes("SUPERVISOR")) return "/supervisor";
  if (roles.includes("PORTERIA")) return "/portero";
  return "/login";
}

export function getRouteLabel(pathname: string) {
  const currentItem = roleNavigationItems.find((item) => pathname.startsWith(item.to));
  return currentItem?.label || "Operación";
}
