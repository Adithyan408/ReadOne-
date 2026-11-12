import { ArrowLeft, Bookmark, CalendarDays, Heart, MessageCircle, User } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Blog } from "../types/Blog";
import { deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";
import { useSavedBlogs } from "../hooks/useSavedBlogs";
import CreateBlogModal from "../Components/CreateBlogModal";
import DeleteConfirmationModal from "../Components/deleteModal";
import CommentSection from "../Components/CommentSection";
import { toggleBlogLike, subscribeToComments } from "../services/blogService";

function BlogDetails() {
  const { id } = useParams();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const blogRef = doc(db, "blogs", id);
    const unsubscribe = onSnapshot(
      blogRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBlog({
            ...(data as Omit<Blog, "id">),
            id: docSnap.id || id,
          });
        } else {
          setBlog(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error subscribing to blog:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

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

  const [, setForceRender] = useState(0);

  // Real-time live comments count (guaranteed >= 0)
  const [commentsCount, setCommentsCount] = useState<number>(() => {
    const initial = blog?.commentsCount ?? (Array.isArray(blog?.comments) ? blog.comments.length : 0);
    return Math.max(0, initial);
  });

  useEffect(() => {
    if (!id) return;
    const unsubComments = subscribeToComments(id, (commentsList) => {
      setCommentsCount(Math.max(0, commentsList.length));
    });

    return () => unsubComments();
  }, [id]);

  // Likes calculation: combines blog document with local storage for instant permanent state
  const docLikes: string[] = Array.isArray(blog?.likes) ? blog.likes : [];
  const isLikedOnDoc = Boolean(user && docLikes.includes(user.uid));

  const isLocallyLiked = Boolean(
    user &&
    id &&
    (() => {
      try {
        const raw = localStorage.getItem(`liked_blogs_${user.uid}`);
        const list: string[] = raw ? JSON.parse(raw) : [];
        return list.includes(id);
      } catch {
        return false;
      }
    })()
  );

  const isLocallyUnliked = Boolean(
    user &&
    id &&
    (() => {
      try {
        const raw = localStorage.getItem(`unliked_blogs_${user.uid}`);
        const list: string[] = raw ? JSON.parse(raw) : [];
        return list.includes(id);
      } catch {
        return false;
      }
    })()
  );

  const isLiked = isLocallyUnliked ? false : isLocallyLiked || isLikedOnDoc;
  const rawBase = docLikes.length > 0 ? docLikes.length : Math.max(0, blog?.likesCount ?? 0);
  const baseCount = Math.max(0, rawBase);

  let calculatedLikes = baseCount;
  if (isLiked && !isLikedOnDoc) {
    calculatedLikes = baseCount + 1;
  } else if (!isLiked && isLikedOnDoc) {
    calculatedLikes = Math.max(0, baseCount - 1);
  }
  const likesCount = Math.max(0, calculatedLikes);

  const handleLike = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!blog || !id || isLiking) return;

    const currentlyLiked = isLiked;
    const nextLiked = !currentlyLiked;

    // Immediately persist in localStorage for instant 0ms update that never gets removed
    try {
      const likedKey = `liked_blogs_${user.uid}`;
      const unlikedKey = `unliked_blogs_${user.uid}`;

      const likedRaw = localStorage.getItem(likedKey);
      const likedList: string[] = likedRaw ? JSON.parse(likedRaw) : [];
      const unlikedRaw = localStorage.getItem(unlikedKey);
      const unlikedList: string[] = unlikedRaw ? JSON.parse(unlikedRaw) : [];

      if (nextLiked) {
        localStorage.setItem(
          likedKey,
          JSON.stringify(Array.from(new Set([...likedList, id])))
        );
        localStorage.setItem(
          unlikedKey,
          JSON.stringify(unlikedList.filter((bId) => bId !== id))
        );
      } else {
        localStorage.setItem(
          likedKey,
          JSON.stringify(likedList.filter((bId) => bId !== id))
        );
        localStorage.setItem(
          unlikedKey,
          JSON.stringify(Array.from(new Set([...unlikedList, id])))
        );
      }
    } catch {
      // ignore
    }

    setForceRender((v) => v + 1);
    setIsLiking(true);

    try {
      await toggleBlogLike(blog.id, user.uid, currentlyLiked);
    } catch (error) {
      console.warn("toggleBlogLike notice:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const { isSaved, toggleSave } = useSavedBlogs();
  const isBlogSavedByDoc = Boolean(
    user && Array.isArray(blog?.savedBy) && blog.savedBy.includes(user.uid)
  );
  const isSavedBlog = blog ? isSaved(blog.id) || isBlogSavedByDoc : false;

  const handleSave = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!blog) return;
    try {
      await toggleSave(blog.id);
    } catch (error) {
      console.error("Error saving blog:", error);
    }
  };

  const scrollToComments = () => {
    const el = document.getElementById("comments-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
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

      {showLoginModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-xl">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">Login Required</h2>
                  <p className="mt-3 text-sm sm:text-base text-gray-600">
                    You need to log in to like this blog and participate in the discussion.
                  </p>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setShowLoginModal(false)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => navigate("/login")}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Login
                    </button>
                  </div>
                </div>
              </div>
    )}

                <div className="min-h-screen bg-[#F8F6F2] overflow-x-clip">
                  {/* Hero */}
                  <section className="relative overflow-hidden">
                    <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[360px] w-[360px] sm:h-[450px] sm:w-[450px] -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />

                      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-8 sm:pt-10">
                        {/* Back */}
                        <Link
                          to="/"
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 sm:px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                        >
                          <ArrowLeft size={18} />
                          Back to Blogs
                        </Link>
                      </div>
                  </section>

                  {/* Content */}
                      <section className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-8 sm:pb-24 sm:pt-8">
                        <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:p-10">
                          {/* Title */}
                            <h1 className="break-words text-2xl font-extrabold leading-tight text-gray-900 sm:text-4xl md:text-5xl">
                              {blog.title}
                            </h1>

                            {/* Meta + Actions */}
                                <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-between gap-4">
                                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs sm:text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                      <User size={16} className="text-gray-400 shrink-0" />
                                      <span className="font-medium text-gray-700 break-words">{blog.author}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <CalendarDays size={16} className="text-gray-400 shrink-0" />
                                      <span>
                                        {blog.createdAt
                                          ? blog.createdAt.toDate().toLocaleDateString("en-US", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                          })
                                          : "Just now"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Show only for the blog owner */}
                                  {user?.uid === blog.userId && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={handleEdit}
                                        className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                                      >
                                        Edit
                                      </button>

                                      <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-red-600 transition hover:bg-red-100"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-6 sm:mt-8 h-px bg-gray-200" />

                                {/* Blog Post Content */}
                                <article
                                  className="prose prose-base sm:prose-lg mt-6 sm:mt-10 max-w-none break-words overflow-x-auto prose-headings:font-bold prose-headings:text-gray-900 prose-p:leading-relaxed prose-p:text-gray-700 prose-a:text-blue-600 prose-img:rounded-2xl"
                                  dangerouslySetInnerHTML={{ __html: blog.content }}
                                />

                                {/* Engagement & Reaction Bar */}
                                    <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-between gap-3 sm:gap-4 rounded-2xl bg-gray-50/80 p-3.5 sm:p-4 border border-gray-100">
                                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                        <button
                                          type="button"
                                          onClick={handleLike}
                                          disabled={isLiking}
                className={`group inline-flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all ${isLiked
                                            ? "bg-rose-50 text-rose-600 border border-rose-200 shadow-xs"
                                            : "bg-white text-gray-700 border border-gray-200 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50/50"
                                            }`}
                                          title={isLiked ? "Unlike blog" : "Like blog"}
                                        >
                                          <Heart
                                            size={17}
                                            className={`transition-transform duration-200 group-hover:scale-115 ${isLiked ? "fill-rose-500 text-rose-500" : "text-gray-400 group-hover:text-rose-500"
                                              }`}
                                          />
                                          <span>
                                            {Math.max(0, likesCount)} {Math.max(0, likesCount) === 1 ? "Like" : "Likes"}
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={scrollToComments}
                                          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-white border border-gray-200 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition"
                                          title="View comments"
                                        >
                                          <MessageCircle size={17} className="text-gray-400" />
                                          <span>
                                            {Math.max(0, commentsCount)} {Math.max(0, commentsCount) === 1 ? "Comment" : "Comments"}
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={handleSave}
                className={`group inline-flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all ${isSavedBlog
                                            ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 scale-105"
                                            : "bg-white text-gray-700 border border-gray-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/50"
                                            }`}
                                          title={isSavedBlog ? "Saved (click to unsave)" : "Save story"}
                                        >
                                          <Bookmark
                                            size={17}
                                            className={`transition-transform duration-200 group-hover:scale-115 ${isSavedBlog ? "fill-white text-white" : "text-gray-400 group-hover:text-blue-600"
                                              }`}
                                          />
                                          <span>{isSavedBlog ? "Saved" : "Save"}</span>
                                        </button>
                                      </div>

                                      <span className="text-xs text-gray-400">
                                        Share your appreciation for the author
                                      </span>
                                    </div>

                                    {/* Comments Section */}
                                    <CommentSection blog={blog} />
                                  </div>
                                </section>
                              </div>
                            </>
                            );
}

                            export default BlogDetails;
