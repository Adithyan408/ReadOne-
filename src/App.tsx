import { Route, Routes } from "react-router-dom";
import Home from "./Pages/Home";
// import Blog from "./Pages/BlogDetails";
import ProtectedRoute from "./Components/ProtectedRoute";
import Login from "./Pages/Login";
import Navbar from "./Components/Navbar";
import CreateBlogModal from "./Components/CreateBlogModal";
import { useState } from "react";
import Signup from "./Pages/Signup";
import BlogDetails from "./Pages/BlogDetails";

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
      <Routes>
        <Route path="/" element={<Home />} />
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
      </Routes>
    </>
  );
}

export default App;
