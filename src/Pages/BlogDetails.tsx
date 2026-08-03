import { ArrowLeft, CalendarDays, User } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Blog } from "../types/Blog";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";
import CreateBlogModal from "../Components/CreateBlogModal";
import DeleteConfirmationModal from "../Components/deleteModal";

function BlogDetails() {
  const { id } = useParams();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return;
      try {
        const blogRef = doc(db, "blogs", id);
        const blogSnap = await getDoc(blogRef);

        if (blogSnap.exists()) {
          setBlog(blogSnap.data() as Blog);
        } else {
          setBlog(null);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const navigate = useNavigate();
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F6F2]">
        <p className="text-lg text-gray-500">Loading blog...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F8F6F2] px-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-700">Blog not found</h2>

        <p className="max-w-sm text-sm text-gray-500">
          The blog you're looking for may have been removed or doesn't exist.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
          Back to Blogs
        </Link>
      </div>
    );
  }

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
      <div className="min-h-screen bg-[#F8F6F2]">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />

          <div className="mx-auto max-w-5xl px-6 pt-10 sm:px-8">
            {/* Back */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              <ArrowLeft size={18} />
              Back to Blogs
            </Link>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-3xl px-6 pb-24 pt-8 sm:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
            {/* Title */}
            <h1 className="text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl">
              {blog.title}
            </h1>

            {/* Meta + Actions */}
            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  {blog.author}
                </div>

                <div className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-gray-400" />
                  {blog.createdAt.toDate().toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

              {/* Show only for the blog owner */}
              {user?.uid === blog.userId && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEdit}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 h-px bg-gray-200" />

            <article
              className="prose prose-lg mt-10 max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:leading-relaxed prose-p:text-gray-700 prose-a:text-blue-600 prose-img:rounded-2xl"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </div>
        </section>
      </div>
    </>
  );
}

export default BlogDetails;
