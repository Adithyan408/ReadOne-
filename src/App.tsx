import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import ProtectedRoute from "./Components/ProtectedRoute";
import AdminProtectedRoute from "./Components/AdminProtectedRoute";
import NavigationGuard from "./Components/NavigationGuard";
import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebar";
import CreateBlogModal from "./Components/CreateBlogModal";
import SavedBlogsProvider from "./context/SavedBlogsProvider";
import AdminAuthProvider from "./context/AdminAuthProvider";
import { useState, lazy, Suspense } from "react";

// Reader Pages
const Home = lazy(() => import("./Pages/Home"));
const Login = lazy(() => import("./Pages/Login"));
const Signup = lazy(() => import("./Pages/Signup"));
const BlogDetails = lazy(() => import("./Pages/BlogDetails"));
const UserProfile = lazy(() => import("./Pages/UserProfile"));
const SavedBlogs = lazy(() => import("./Pages/SavedBlogs"));

// Admin Pages (Lazy Loaded)
const AdminLayout = lazy(() => import("./Pages/Admin/AdminLayout"));
const AdminUsers = lazy(() => import("./Pages/Admin/AdminUsers"));
const AdminUserProfile = lazy(() => import("./Pages/Admin/AdminUserProfile"));
const AdminNotifications = lazy(() => import("./Pages/Admin/AdminNotifications"));
const AdminLogin = lazy(() => import("./Pages/Admin/AdminLogin"));

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <AdminAuthProvider>
      <NavigationGuard />
      <SavedBlogsProvider>
        {/* Render Reader Navbar, Sidebar & Modal only on non-admin routes */}
        {!isAdminRoute && (
          <>
            <Navbar
              onCreate={() => setIsModalOpen(true)}
              onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            />

            {/* Sticked Fixed Sidebar Drawer for User / Reader */}
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              onCreateBlog={() => setIsModalOpen(true)}
              mode="user"
            />

            <CreateBlogModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              mode="create"
            />
          </>
        )}

        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
                <p className="text-sm font-medium text-gray-500">
                  Loading ReadOne...
                </p>
              </div>
            </div>
          }
        >
          <Routes>
            {/* Public & Reader Routes */}
            <Route
              path="/"
              element={<Home onCreate={() => setIsModalOpen(true)} />}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/blog/:id" element={<BlogDetails />} />

            <Route
              path="/user"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <SavedBlogs />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes with Lazy Loading & Client-Side Authentication */}
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route index element={<AdminUsers />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:userId" element={<AdminUserProfile />} />
              <Route path="blogs/:id" element={<BlogDetails isAdminView />} />
              <Route path="notifications" element={<AdminNotifications />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </SavedBlogsProvider>
    </AdminAuthProvider>
  );
}

export default App;
