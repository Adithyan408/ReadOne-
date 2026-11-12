import { FaBookOpen } from "react-icons/fa";
import { Menu, PenSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { useEffect, useState } from "react";

type Props = {
  onCreate: () => void;
  onToggleSidebar: () => void;
};

function Navbar({ onCreate, onToggleSidebar }: Props) {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  const handleCreate = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    onCreate();
  };

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
          {/* Left: Sidebar Toggle + Logo */}
            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={onToggleSidebar}
                className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition"
                title="Open navigation menu"
                aria-label="Toggle navigation menu"
              >
                <Menu size={20} />
              </button>

                  <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                      <FaBookOpen className="text-blue-600 text-base sm:text-lg" />
                    </div>

                      <h1 className="truncate text-lg sm:text-2xl font-bold text-gray-800">
                        Read<span className="text-blue-600">One</span>
                      </h1>
                  </Link>
                </div>

                {/* Right Side */}
                  <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                    <button
                      onClick={handleCreate}
                      aria-label="Write a new story"
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 sm:px-5 sm:py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 shadow-xs"
                    >
                      <PenSquare size={17} />
                      <span className="hidden sm:inline">Write</span>
                    </button>

                    {!user ? (
                      <Link
                        to="/login"
                        className="rounded-xl border border-gray-300 px-3 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        Login
                      </Link>
                    ) : (
                      <Link
                        to="/user"
                        className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-gray-100 py-1.5 px-2.5 sm:px-4 sm:py-2 hover:bg-gray-200/80 transition"
                        title="Go to profile"
                      >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white uppercase">
                            {(user.displayName || user.email || "U")[0]}
                          </div>

                            <span className="max-w-[72px] sm:max-w-[120px] truncate text-xs sm:text-sm font-medium text-gray-700">
                              {user.displayName || "User"}
                            </span>
                          </Link>
                  )}
                        </div>
                      </div>
            </nav>
                  );
}

                  export default Navbar;
