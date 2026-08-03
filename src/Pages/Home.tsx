import BlogCard from "../Components/BlogCard";
import { Search } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";

import { useEffect, useState } from "react";
import type { Blog } from "../types/Blog";
import { useAuth } from "../hooks/useAuth";

function Home() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const {user} = useAuth()


  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const snapshot = await getDocs(collection(db, "blogs"));

        const blogsData: Blog[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Blog, "id">),
        }));

        setBlogs(blogsData);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading blogs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Blur */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl" />

        <div className="mx-auto w-full max-w-[1200px] px-6 py-24 sm:px-8 md:px-10 md:py-28 lg:px-14">
          <div className="flex flex-col items-center text-center">
            <span className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
              ✨ Welcome to ReadOne
            </span>

            <h1 className="mt-8 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Discover Stories that
              <span className="text-blue-600"> Inspire</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
              Read insightful articles, publish your own ideas, and connect with
              a community of passionate writers from around the world.
            </p>

            {/* Search */}
            <div className="mt-12 w-full max-w-xl px-2 sm:px-0">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <Search size={20} className="shrink-0 text-gray-400" />

                <input
                  type="text"
                  placeholder="Search blogs..."
                  className="w-full bg-transparent text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Stories */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pb-24 sm:px-8 md:px-10 md:pb-28 lg:px-14">
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl">
              Latest Stories
            </h2>

            <p className="mt-2 text-gray-500">
              Explore what our community is writing today.
            </p>
          </div>

          <button className="self-start rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 sm:self-auto">
            View All
          </button>
        </div>

        {/* Blog Grid */}
        <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
          {blogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
