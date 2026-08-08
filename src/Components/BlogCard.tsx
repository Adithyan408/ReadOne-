import { Link, useNavigate } from "react-router-dom";
import type { Blog } from "../types/Blog";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { Pencil, Trash2, User } from "lucide-react";
import { deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import CreateBlogModal from "./CreateBlogModal";
import DeleteConfirmationModal from "./deleteModal";

type Props = {
  blog: Blog;
};

const formatPublishedDate = (createdAt: Timestamp | null | undefined) => {
  if (!createdAt) {
    return "Just now";
  }
  const date = createdAt.toDate(); 
  const now = new Date();

  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function BlogCard({ blog }: Props) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const plainText = blog.description.replace(/<[^>]*>/g, "");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEdit = () => {
    setShowEditModal(true);
  };
  

  const handleDelete = async (Bid: string) => {
    try {
      await deleteDoc(doc(db, "blogs", Bid));
      setShowDeleteModal(false);
      navigate("/");
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Failed to delete the blog. Please try again.");
    }
  };
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) {
      return <p>Loading...</p>;
    }
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    navigate(`/blog/${blog.id}`);
  };

  return (
    <>
      <CreateBlogModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        mode="edit"
        blog={blog}
      />
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Blog"
        message={`Are you sure you want to permanently delete "${blog.title}"?`}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => handleDelete(blog.id)}
      />
      
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800">Login Required</h2>

            <p className="mt-3 text-gray-600">
              You need to log in to read the full article.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={() => navigate("/login")}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
      <Link
        to={`/blog/${blog.id}`}
        onClick={handleClick}
        className="group flex h-full w-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
      >
        {/* Content */}
        <div className="flex flex-1 flex-col p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <h2 className="line-clamp-2 flex-1 text-2xl font-bold leading-tight text-gray-800 transition-colors duration-300 group-hover:text-blue-600">
              {blog.title}
            </h2>

            {user ? (
              user.uid === blog.userId ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEdit();
                    }}
                    className="rounded-full p-2 text-blue-600 transition hover:bg-blue-100"
                    title="Edit blog"
                  >
                    <Pencil size={12} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDeleteModal(true);
                    }}
                    className="rounded-full p-2 text-red-600 transition hover:bg-red-100"
                    title="Delete blog"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <User size={12} />
                  <span className="truncate max-w-20">{blog.author}</span>
                </div>
              )
            ) : null}
          </div>

          <p className="mt-4 line-clamp-3 flex-1 text-[15px] leading-7 text-gray-600">
            {plainText}
          </p>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="font-medium text-blue-600 transition-transform duration-300 group-hover:translate-x-1">
              Read More →
            </span>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
              Published {formatPublishedDate(blog.createdAt)}
            </span>
          </div>
        </div>
      </Link>
    </>
  );
}

export default BlogCard;
