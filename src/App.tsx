import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./Components/ProtectedRoute";
import Navbar from "./Components/Navbar";
import CreateBlogModal from "./Components/CreateBlogModal";
import { useState } from "react";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("./Pages/Home"));
const Login = lazy(() => import("./Pages/Login"));
const Signup = lazy(() => import("./Pages/Signup"));
const BlogDetails = lazy(() => import("./Pages/BlogDetails"));

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <Navbar onCreate={() => setIsModalOpen(true)} />

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
          <Route path="/" element={<Home onCreate={() => setIsModalOpen(true)}/>} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
