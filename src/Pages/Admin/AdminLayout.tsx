import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../Components/Sidebar";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { useLockBackNavigation } from "../../hooks/useLockBackNavigation";
import {
  Menu,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Users,
  Bell,
} from "lucide-react";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { adminUsername, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Lock browser back button navigation when on the admin dashboard
  useLockBackNavigation(true);

  const isUsers =
    location.pathname === "/admin" || location.pathname === "/admin/users";
  const isNotifications = location.pathname === "/admin/notifications";

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  const handleViewSite = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Reused Sidebar in Admin Mode */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        mode="admin"
      />

      {/* Top Admin Navbar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-gray-200 bg-white/95 px-3 sm:px-8 backdrop-blur-md">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="shrink-0 rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                title="Open navigation menu"
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>

                  <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                      <ShieldCheck size={20} />
                    </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="truncate text-sm sm:text-base font-bold text-gray-900">
                              ReadOne Admin
                            </span>
                            <span className="hidden sm:inline-flex rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                              Dashboard
                            </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Active Page Pill */}
                    <div className="hidden md:flex items-center gap-1.5 ml-4 pl-4 border-l border-gray-200 text-xs text-gray-500">
                      {isUsers && (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-gray-800">
                          <Users size={14} className="text-indigo-600" />
                          User Management
                        </span>
                      )}
                      {isNotifications && (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-gray-800">
                          <Bell size={14} className="text-indigo-600" />
                          Notifications
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side action shortcuts */}
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={handleViewSite}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 sm:px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
                        title="Go to reader blog website"
                        aria-label="View Site"
                      >
                        <ExternalLink size={14} />
                        <span className="hidden sm:inline">View Site</span>
                      </button>

                          <div className="flex items-center gap-2 sm:gap-2.5 pl-1.5 sm:pl-2 border-l border-gray-200">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-xs font-bold text-white uppercase shadow-xs">
                              {(adminUsername || "A")[0]}
                            </div>
                            <span className="hidden sm:inline text-xs font-semibold text-gray-700">
                              {adminUsername || "Admin"}
                            </span>

                            <button
                              type="button"
                              onClick={handleLogout}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                              title="Sign out of admin"
                              aria-label="Sign out of admin"
                            >
                              <LogOut size={16} />
                            </button>
                          </div>
                        </div>
                      </header>

                      {/* Main Admin Content Body */}
                      <main className="flex-1 overflow-x-hidden">
                        <Outlet />
                      </main>
                    </div>
                    );
}
