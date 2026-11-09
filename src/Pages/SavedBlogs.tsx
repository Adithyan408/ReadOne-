import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";
import { useSavedBlogs } from "../hooks/useSavedBlogs";
import type { Blog } from "../types/Blog";
import BlogCard from "../Components/BlogCard";
import { Bookmark, Compass } from "lucide-react";
import { Link } from "react-router-dom";

function SavedBlogs() {
  const { user } = useAuth();
  const { isSaved, loading: savedLoading } = useSavedBlogs();
  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "blogs"),
      (snapshot) => {
        const blogs: Blog[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Blog, "id">),
        }));
        setAllBlogs(blogs);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching blogs for saved page:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter blogs: must be saved by the user
  const savedBlogs = allBlogs.filter((b) => {
    const isDocSaved = Boolean(
      user && Array.isArray(b.savedBy) && b.savedBy.includes(user.uid)
    );
    return isSaved(b.id) || isDocSaved;
  });

  return (
    <div className="min-h-screen bg-[#F8F6F2] pb-24">
      {/* Background Blur */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[450px] w-[500px] -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        {/* Header Banner */}
        <div className="rounded-3xl border border-gray-200/80 bg-white/90 p-6 sm:p-10 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-xs">
                <Bookmark size={28} className="fill-blue-600/20 text-blue-600" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  Saved Blogs
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Stories you've bookmarked for reading later.
                </p>
              </div>
            </div>

            <span className="self-start sm:self-auto rounded-full bg-blue-100 px-3.5 py-1 text-xs font-semibold text-blue-700">
              {savedBlogs.length} {savedBlogs.length === 1 ? "Story" : "Stories"}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-10">
          {loading || savedLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-base text-gray-500">Loading saved blogs...</p>
            </div>
          ) : savedBlogs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {savedBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white/70 p-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
                <Bookmark size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                No saved stories yet
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-500 leading-relaxed">
                Discover inspiring articles by other writers in the community.
                Click the bookmark icon on any story card to save it here for later.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <Compass size={17} />
                Explore Feed
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SavedBlogs;

