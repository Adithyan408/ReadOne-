import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import {
  fetchAdminUserById,
  type AdminUser,
} from "../../services/adminService";
import type { Blog } from "../../types/Blog";
import BlogCard from "../../Components/BlogCard";
import {
  ArrowLeft,
  BookOpen,
  Heart,
  MessageCircle,
  Sparkles,
} from "lucide-react";

type LocationState = {
  user?: AdminUser;
} | null;

export default function AdminUserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const initialUser = (location.state as LocationState)?.user ?? null;

  const [profileUser, setProfileUser] = useState<AdminUser | null>(
    initialUser && initialUser.uid === userId ? initialUser : null
  );
  const [userLoading, setUserLoading] = useState<boolean>(!profileUser);
  const [userBlogs, setUserBlogs] = useState<Blog[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    fetchAdminUserById(userId)
      .then((fetched) => {
        if (isMounted) {
          if (fetched) {
            setProfileUser(fetched);
          }
          setUserLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch admin user profile:", err);
        if (isMounted) {
          setUserLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const blogsQuery = query(
      collection(db, "blogs"),
      where("userId", "==", userId)
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
        setBlogsLoading(false);
      },
      (error) => {
        console.error("Error fetching user blogs for admin:", error);
        setBlogsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

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

  if (userLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F8F6F2] px-4">
        <p className="text-base text-gray-500">Loading user profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 bg-[#F8F6F2] px-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-700">User not found</h2>
        <p className="max-w-sm text-sm text-gray-500">
          This user profile could not be loaded or no longer exists.
        </p>
        <Link
          to="/admin/users"
          replace
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
          Back to Users
        </Link>
      </div>
    );
  }

  const isBlocked = profileUser.status === "blocked";

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#F8F6F2] pb-16 sm:pb-24">
      {/* Background Blur */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[360px] w-[360px] sm:h-[450px] sm:w-[500px] -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:pt-10 sm:px-6 lg:px-8">
        {/* Back to Users Directory */}
        <div className="mb-5">
          <Link
            to="/admin/users"
            replace
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 sm:px-4 text-sm font-medium text-gray-700 shadow-xs transition hover:bg-gray-100"
          >
            <ArrowLeft size={18} />
            Back to Users
          </Link>
        </div>

        {/* Profile Card Banner (mirrors UserProfile) */}
        <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200/80 bg-white/90 p-5 sm:p-10 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6">
            {/* User Avatar + Details */}
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div className="flex h-14 w-14 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xl sm:text-3xl font-extrabold text-white shadow-md uppercase">
                {(profileUser.displayName || profileUser.email || "U")[0]}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="break-words text-xl sm:text-3xl font-bold text-gray-900">
                    {profileUser.displayName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
                    <Sparkles size={11} /> {profileUser.role || "Author"}
                  </span>
                </div>

                <p className="mt-1 break-all text-xs sm:text-sm text-gray-500">
                  {profileUser.email}
                </p>
              </div>
            </div>

            {/* Account Status Badge */}
            <div className="self-start sm:self-center">
              {isBlocked ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700 border border-rose-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Blocked Account
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Account
                </span>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3 pt-5 sm:pt-6 border-t border-gray-100">
            <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wider">
                <BookOpen size={16} className="text-blue-600" />
                Number of Posts
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
        <div className="mt-8 sm:mt-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Published Stories
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Inspect stories by {profileUser.displayName}. Open any story to view
                or moderate comments, or delete posts directly.
              </p>
            </div>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {userBlogs.length} {userBlogs.length === 1 ? "Post" : "Posts"}
            </span>
          </div>

          {blogsLoading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <p className="text-base text-gray-500">Loading user stories...</p>
            </div>
          ) : userBlogs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} isAdminView />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[280px] sm:min-h-[300px] flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-dashed border-gray-300 bg-white/70 p-6 sm:p-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
                <BookOpen size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                No published stories yet
              </h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500">
                {profileUser.displayName} hasn't published any blog posts yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

