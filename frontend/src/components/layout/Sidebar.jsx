// src/components/layout/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { roleNavigationItems } from "../../domain/roleNavigation";
import { useUIStore } from "../../store/uiStore";

export function Sidebar({ isOpen = false, onClose }) {
  const location = useLocation();
  const { collapsed, toggleSidebar } = useUIStore();
  const roles = useAuthStore((state) => state.user?.roles || []);

  // Contenido compartido (desktop y móvil)
  const SidebarContent = () => (
    <>
      {/* Header con botones: en móvil el de cerrar, en desktop el toggle */}
      <div className="flex justify-end p-3">
        {/* Botón cerrar (solo móvil) */}
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-neutral-500 transition-colors hover:bg-neutral-100 lg:hidden"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>

        {/* Botón toggle colapso (solo desktop) */}
        <button
          onClick={toggleSidebar}
          className="hidden h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 lg:flex"
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          ) : (
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 px-2">
        {roleNavigationItems
          .filter((item) => item.roles.some((role) => roles.includes(role)))
          .map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            const Icon = item.Icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => onClose?.()}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : ""}
              >
                <span className="flex-shrink-0">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
      </nav>

      {/* Footer versión */}
      <div className={`border-t border-neutral-200 text-center text-xs text-neutral-400 ${!collapsed ? "p-3" : "py-3"}`}>
        {!collapsed ? "v1.0.0" : "v1"}
      </div>
    </>
  );

  const baseClasses = `
    flex h-full flex-col border-r border-neutral-200 bg-white/90 backdrop-blur-sm transition-all duration-300
    ${collapsed ? "w-16" : "w-64"}
  `;

  return (
    <>
      {/* Desktop: siempre visible */}
      <aside className={`hidden lg:flex ${baseClasses}`}>
        <SidebarContent />
      </aside>

      {/* Móvil: drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex transform transition-transform duration-300 ease-in-out
          lg:hidden ${baseClasses} shadow-xl
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
