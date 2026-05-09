import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Menu } from "lucide-react";
import { useRealtime } from "../../hooks/useRealtime";
import { useAuthStore } from "../../store/authStore";
import { Badge } from "../ui/Badge";
import iceStarSmallLogo from "../icons/icon-icestar.png";

export function Topbar({ onMenuClick }) {
  const navigate = useNavigate();
  const { syncState } = useRealtime();
  const { user, clearSession } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/95 px-4 shadow-sm backdrop-blur-sm sm:px-6">
      {/* Sección izquierda: menú hamburguesa + logo */}
      <div className="flex items-center gap-2">
        {/* Botón hamburguesa (solo visible en móvil) */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1 text-neutral-500 transition-colors hover:bg-neutral-100 lg:hidden"
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
        <span className="text-base font-semibold text-neutral-800 sm:text-lg">
          Muelles
        </span>
        <span className="hidden text-xs text-neutral-400 sm:inline">|</span>
        <span className="hidden text-sm text-neutral-500 sm:inline">
          Control en tiempo real
        </span>
      </div>

      {/* Acciones derecha (sin cambios) */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Badge status={syncState} className="hidden sm:inline-flex">
          {syncState === "connected"
            ? "En vivo"
            : syncState === "connecting"
            ? "Conectando..."
            : "Sin conexión"}
        </Badge>

        <button
          className="relative rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-error-500 ring-2 ring-white" />
        </button>

        {/* Menú de usuario */}
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
