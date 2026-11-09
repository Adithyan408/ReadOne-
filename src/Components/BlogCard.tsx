import { Link, useNavigate } from "react-router-dom";
import type { Blog } from "../types/Blog";
import { useAuth } from "../hooks/useAuth";
import { useSavedBlogs } from "../hooks/useSavedBlogs";
import { useState } from "react";
import { Bookmark, Heart, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import CreateBlogModal from "./CreateBlogModal";
import DeleteConfirmationModal from "./deleteModal";
import { toggleBlogLike } from "../services/blogService";

type Props = {
  blog: Blog;
};

  const formatSimplifiedDate = (createdAt: Timestamp | null | undefined) => {
    if (!createdAt) {
      return "Just now";
    }
    const date = createdAt.toDate();
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  function BlogCard({ blog }: Props) {
    const { user, loading } = useAuth();
    const { isSaved, toggleSave } = useSavedBlogs();
    const navigate = useNavigate();

    const plainText = blog.description.replace(/<[^>]*>/g, "");
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const likes = blog.likes ?? [];
    const isLiked = user ? likes.includes(user.uid) : false;
    const likesCount = blog.likesCount ?? likes.length ?? 0;
    const commentsCount = blog.commentsCount ?? 0;
    const saved = isSaved(blog.id);

    const handleLike = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (loading) return;
      if (!user) {
        setShowLoginModal(true);
        return;
      }
      try {
        await toggleBlogLike(blog.id, user.uid, isLiked);
      } catch (error) {
        console.error("Error toggling like:", error);
      }
    };

    const handleSave = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (loading) return;
      if (!user) {
        setShowLoginModal(true);
        return;
      }
      try {
        await toggleSave(blog.id);
      } catch (error) {
        console.error("Error saving blog:", error);
      }
    };

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
      if (loading) return;
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 className="text-xl font-bold text-gray-800">Login Required</h2>
                <p className="mt-3 text-gray-600">
                  You need to log in to read the full article, like, or save stories.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 text-sm font-medium shadow-xs"
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
              className="group flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
            >
                  <div>
                    {/* Author Header */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-bold text-white uppercase shadow-xs">
                          {blog.author ? blog.author[0] : "A"}
                        </div>
                        <span className="truncate text-xs font-semibold text-gray-700">
                          {blog.author || "Anonymous"}
                        </span>
                        {user?.uid === blog.userId && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 border border-blue-100">
                            You
                          </span>
                        )}
                      </div>

                        {/* Edit / Delete (Blog Owner) */}
                        {user?.uid === blog.userId && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEdit();
                  }}
                  className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50"
                  title="Edit blog"
                >
                  <Pencil size={13} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteModal(true);
                  }}
                  className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                  title="Delete blog"
                >
                  <Trash2 size={13} />
                </button>
                    </div>
            )}
                  </div>

                    {/* Title */}
                    <h2 className="line-clamp-2 text-xl font-bold leading-snug text-gray-900 transition-colors duration-200 group-hover:text-blue-600">
                      {blog.title}
                    </h2>

                  {/* Excerpt */}
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600">
                    {plainText}
                  </p>
                </div>

                {/* Footer Engagement Area */}
                <div className="mt-6 flex items-center justify-between gap-2 border-t border-gray-100 pt-4">
                  {/* Left: Likes & Comments */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLike}
                      className={`group/like flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${isLiked
                          ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                          : "bg-gray-50 text-gray-600 hover:bg-rose-50 hover:text-rose-600"
                        }`}
                      title={isLiked ? "Unlike blog" : "Like blog"}
                    >
                      <Heart
                        size={14}
                        className={`transition-transform duration-200 group-hover/like:scale-110 ${isLiked
                            ? "fill-rose-500 text-rose-500"
                            : "text-gray-400 group-hover/like:text-rose-500"
                          }`}
                      />
                      <span>{likesCount}</span>
                    </button>

                    <div
                      className="flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600"
                      title={`${commentsCount} comments`}
                    >
                      <MessageCircle size={14} className="text-gray-400" />
                      <span>{commentsCount}</span>
                    </div>
                  </div>

                  {/* Right: Simplified published date & Save button */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-medium text-gray-400">
                      {formatSimplifiedDate(blog.createdAt)}
                    </span>

                    <button
                      type="button"
                      onClick={handleSave}
                      className={`group/save flex h-8 w-8 items-center justify-center rounded-full transition ${saved
                          ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          : "text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                        }`}
                      title={saved ? "Remove from saved" : "Save for later"}
                    >
                      <Bookmark
                        size={16}
                        className={`transition-transform duration-200 group-hover/save:scale-110 ${saved ? "fill-blue-600 text-blue-600" : ""
                          }`}
                      />
                    </button>
                  </div>
                </div>
            </Link>
          </>
        );
}

        export default BlogCard;
