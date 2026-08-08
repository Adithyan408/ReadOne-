import { FaBookOpen } from "react-icons/fa";
import { LogOut, PenSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";

type Props = {
  onCreate: () => void;
};

function Navbar({ onCreate }: Props) {
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

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/", {replace:true});
    
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
            <FaBookOpen className="text-blue-600 text-lg" />
          </div>

          <h1 className="text-2xl font-bold text-gray-800">
            Read<span className="text-blue-600">One</span>
          </h1>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <PenSquare size={18} />
            Write
          </button>

          {!user ? (
            <Link
              to="/login"
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Login
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
                <span className="text-lg">😊</span>

                <span className="text-sm font-medium text-gray-700">
                  {user.displayName || "User"}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-lg p-2 transition hover:bg-red-50 hover:text-red-600"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;