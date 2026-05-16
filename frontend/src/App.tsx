import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";

const SIDEBAR_OPEN_STORAGE_KEY = "ui.sidebar.open";
const LG_BREAKPOINT_PX = 1024;

export default function App() {
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      if (!prev) return prev;
      menuButtonRef.current?.focus();
      return false;
    });
  }, []);

  useEffect(() => {
    closeSidebar(); // cierra drawer al navegar
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_OPEN_STORAGE_KEY, String(isSidebarOpen));
    } catch {
      // Ignore storage errors (private mode / blocked storage)
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= LG_BREAKPOINT_PX) {
        closeSidebar();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [closeSidebar]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add("overflow-hidden");
      return () => document.body.classList.remove("overflow-hidden");
    }

    document.body.classList.remove("overflow-hidden");
    return undefined;
  }, [isSidebarOpen]);

  return (
    <div className="h-screen overflow-hidden bg-neutral-100">
      <div className="flex h-full">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <div className="flex flex-1 flex-col h-full min-w-0">
          <Topbar onMenuClick={toggleSidebar} menuButtonRef={menuButtonRef} />
          <main className="flex-1 overflow-y-auto p-2 md:p-2.5">
            <Outlet />
          </main>
        </div>
      </div>
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 ${
          isSidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeSidebar}
        role="button"
        aria-label="Cerrar menú lateral"
        aria-hidden={!isSidebarOpen}
      />
    </div>
  );
}
