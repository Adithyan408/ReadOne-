import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";
import type { Blog } from "../types/Blog";
import BlogCard from "../Components/BlogCard";
import CreateBlogModal from "../Components/CreateBlogModal";
import { BookOpen, Heart, MessageCircle, PenSquare, Sparkles } from "lucide-react";

function UserProfile() {
  const { user } = useAuth();
  const [userBlogs, setUserBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    const blogsQuery = query(
      collection(db, "blogs"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      blogsQuery,
      (snapshot) => {
        const blogs: Blog[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Blog, "id">),
        }));

        // Sort by createdAt descending
        blogs.sort((a, b) => {
          const timeA = a.createdAt?.toDate().getTime() ?? 0;
          const timeB = b.createdAt?.toDate().getTime() ?? 0;
          return timeB - timeA;
        });

        setUserBlogs(blogs);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching user blogs:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const totalLikes = Math.max(
      0,
      userBlogs.reduce(
        (sum, b) => sum + Math.max(0, b.likesCount ?? b.likes?.length ?? 0),
        0
      )
    );
  const totalComments = Math.max(
      0,
      userBlogs.reduce(
        (sum, b) =>
          sum +
          Math.max(
            0,
            b.commentsCount ?? (Array.isArray(b.comments) ? b.comments.length : 0)
          ),
        0
      )
    );

  return (
    <>
      <CreateBlogModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
      />

      <div className="min-h-screen bg-[#F8F6F2] pb-24">
        {/* Background Blur */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[450px] w-[500px] -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          {/* Profile Card Banner */}
          <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white/90 p-6 sm:p-10 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              {/* User Avatar + Details */}
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-2xl sm:text-3xl font-extrabold text-white shadow-md uppercase">
                  {(user?.displayName || user?.email || "U")[0]}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {user?.displayName || "Author"}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
                      <Sparkles size={11} /> Author
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>

              {/* Action */}
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <PenSquare size={16} />
                <span>Write Story</span>
              </button>
            </div>

            {/* Stats Row */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 pt-6 border-t border-gray-100">
              <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wider">
                  <BookOpen size={16} className="text-blue-600" />
                  Stories Published
                </div>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {userBlogs.length}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wider">
                  <Heart size={16} className="text-rose-500" />
                  Total Likes Received
                </div>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {totalLikes}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wider">
                  <MessageCircle size={16} className="text-indigo-500" />
                  Total Comments
                </div>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {totalComments}
                </p>
              </div>
            </div>
          </div>

          {/* User's Blogs Listing */}
          <div className="mt-12">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  My Published Stories
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage and view all stories written by you.
                </p>
              </div>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                {userBlogs.length} {userBlogs.length === 1 ? "Story" : "Stories"}
              </span>
            </div>

            {loading ? (
              <div className="flex min-h-[250px] items-center justify-center">
                <p className="text-base text-gray-500">Loading your stories...</p>
              </div>
            ) : userBlogs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {userBlogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white/70 p-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
                  <BookOpen size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  You haven't written any stories yet
                </h3>
                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  Share your ideas, experiences, and insights with readers across the world.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  <PenSquare size={16} />
                  Write Your First Story
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default UserProfile;

