import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./Components/ProtectedRoute";
import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebar";
import CreateBlogModal from "./Components/CreateBlogModal";
import SavedBlogsProvider from "./context/SavedBlogsProvider";
import { useState, lazy, Suspense } from "react";

const Home = lazy(() => import("./Pages/Home"));
const Login = lazy(() => import("./Pages/Login"));
const Signup = lazy(() => import("./Pages/Signup"));
const BlogDetails = lazy(() => import("./Pages/BlogDetails"));
const UserProfile = lazy(() => import("./Pages/UserProfile"));
const SavedBlogs = lazy(() => import("./Pages/SavedBlogs"));

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
      <SavedBlogsProvider>
        <Navbar
          onCreate={() => setIsModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* Sticked Fixed Sidebar Drawer */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onCreateBlog={() => setIsModalOpen(true)}
        />

        <CreateBlogModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode="create"
        />

        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <p className="text-lg">Loading...</p>
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={<Home onCreate={() => setIsModalOpen(true)} />}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
              path="/blog/:id"
              element={
                <ProtectedRoute>
                  <BlogDetails />
                </ProtectedRoute>
              }
            />

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

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
    </SavedBlogsProvider >
  );
}

export default App;
