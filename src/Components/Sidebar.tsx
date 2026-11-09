import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSavedBlogs } from "../hooks/useSavedBlogs";
import { auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import {
  Bookmark,
  Home,
  LogOut,
  PenSquare,
  User,
  X,
  LogIn,
} from "lucide-react";
import { FaBookOpen } from "react-icons/fa";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreateBlog: () => void;
};

function Sidebar({ isOpen, onClose, onCreateBlog }: Props) {
  const { user } = useAuth();
  const { savedBlogIds } = useSavedBlogs();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navLinks = [
    {
      label: "Home",
      description: "Explore all stories",
      path: "/",
      icon: Home,
    },
    {
      label: "User",
      description: "Profile & my stories",
      path: "/user",
      icon: User,
    },
    {
      label: "Saved Blogs",
      description: "Bookmarked articles",
      path: "/saved",
      icon: Bookmark,
      badge: savedBlogIds.length > 0 ? savedBlogIds.length : null,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Fixed Sticky Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 flex h-screen w-72 sm:w-80 flex-col border-r border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-6">
          <div
            onClick={() => handleNavigate("/")}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <FaBookOpen className="text-blue-600 text-base" />
            </div>
            <span className="text-xl font-bold text-gray-800">
              Read<span className="text-blue-600">One</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            title="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card (if authenticated) */}
        {user ? (
          <div
            onClick={() => handleNavigate("/user")}
            className="mx-4 mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 p-3.5 border border-blue-100/80 cursor-pointer hover:border-blue-200 transition"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-xs uppercase">
              {(user.displayName || user.email || "U")[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-bold text-gray-800">
                {user.displayName || "User"}
              </p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="mx-4 mt-4 rounded-2xl bg-gray-50 p-4 border border-gray-200/60 text-center">
            <p className="text-xs text-gray-600">
              Sign in to write, bookmark, and personalize your experience.
            </p>
            <button
              onClick={() => handleNavigate("/login")}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
            >
              <LogIn size={13} />
              Sign in
            </button>
          </div>
        )}

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Navigation
          </p>

          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all ${
                  isActive
                    ? "bg-blue-50 font-semibold text-blue-600 shadow-xs"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={20}
                    className={
                      isActive
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-600"
                    }
                  />
                  <div>
                    <span className="block text-sm leading-tight">
                      {item.label}
                    </span>
                    <span className="block text-[11px] text-gray-400 font-normal leading-tight mt-0.5">
                      {item.description}
                    </span>
                  </div>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4">
            <button
              onClick={() => {
                if (!user) {
                  handleNavigate("/login");
                  return;
                }
                onCreateBlog();
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 px-4 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <PenSquare size={17} />
              <span>Write a Story</span>
            </button>
          </div>
        </div>

        {/* Bottom Down Logout Option */}
        <div className="mt-auto border-t border-gray-100 p-4">
          {user ? (
            <button
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
            >
              <LogOut
                size={18}
                className="transition-transform group-hover:-translate-x-0.5"
              />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => handleNavigate("/login")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <LogIn size={18} />
              <span>Login</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

