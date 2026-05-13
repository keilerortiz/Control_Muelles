import { useState, useRef, useEffect } from "react";
import type { MutableRefObject } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LogOut, Menu, RotateCw } from "lucide-react";
import { useRealtime } from "../../hooks/useRealtime";
import { useAuthStore } from "../../store/authStore";
import { getRouteLabel } from "../../domain/roleNavigation";
import { Badge } from "../ui/Badge";
import { DateRangePicker } from "../ui/DateRangePicker";
import iceStarSmallLogo from "../icons/icon-icestar.png";

interface TopbarProps {
  onMenuClick: () => void;
  menuButtonRef: MutableRefObject<HTMLButtonElement | null>;
}

export function Topbar({ onMenuClick, menuButtonRef }: TopbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { syncState } = useRealtime();
  const { user, clearSession } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: "active" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";
  const routeLabel = getRouteLabel(location.pathname);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-3 sm:px-4">
      <div className="flex items-center gap-3">
        <button
          ref={menuButtonRef}
          onClick={onMenuClick}
          className="rounded-lg p-1 text-neutral-500 transition-colors hover:bg-neutral-100"
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" strokeWidth={1.5} />
        </button>

        {/* Logo y nombre */}
        <img
          src={iceStarSmallLogo}
          alt="IceStar"
          className="h-8 w-8 rounded-lg object-contain"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-neutral-800 sm:text-lg">
              Muelles
            </span>
            <span className="hidden text-xs text-neutral-400 sm:inline">|</span>
            <span className="hidden text-sm text-neutral-500 sm:inline">
              {routeLabel}
            </span>
          </div>
          <p className="hidden text-xs text-neutral-400 sm:block">Gestión de muelles</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <DateRangePicker />
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white p-1.5 text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isRefreshing}
            aria-label="Actualizar datos"
            title="Actualizar datos"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} strokeWidth={1.75} />
          </button>
        </div>

        <Badge status={syncState} className="hidden sm:inline-flex">
          {syncState === "CONNECTED"
            ? "Live"
            : syncState === "CONNECTING" || syncState === "RECONNECTING"
            ? "Connecting..."
            : "Offline"}
        </Badge>

        <div className="flex items-center gap-2 sm:hidden">
          <DateRangePicker compact />
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white p-1.5 text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isRefreshing}
            aria-label="Actualizar datos"
            title="Actualizar datos"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} strokeWidth={1.75} />
          </button>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 transition-all hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
              {userInitial}
            </div>
            <span className="hidden text-sm font-medium text-neutral-700 sm:inline">
              {user?.name?.split(" ")[0] || "Usuario"}
            </span>
            <ChevronDown
              strokeWidth={1.5}
              className={`hidden h-4 w-4 text-neutral-400 transition-transform sm:block ${
                isUserMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-neutral-200 focus:outline-none">
              <div className="border-b border-neutral-100 px-4 py-3">
                <p className="text-sm font-medium text-neutral-800">
                  {user?.name || "Sin sesión"}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {user?.email || "usuario@ejemplo.com"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-error-600"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
