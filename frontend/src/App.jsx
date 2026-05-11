import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    closeSidebar(); // cierra drawer al navegar
  }, [location.pathname]);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-neutral-100 via-brand-50 to-neutral-200">
      <div className="flex h-full">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <div className="flex flex-1 flex-col h-full overflow-hidden">
          <Topbar onMenuClick={toggleSidebar} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
}