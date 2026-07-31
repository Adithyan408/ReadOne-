import BlogCard from "../Components/BlogCard";
import { Search } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";

import { useEffect, useState } from "react";
import type { Blog } from "../types/Blog";

function Home() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
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
        <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl"></div>

        <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 lg:px-14">
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700">
              ✨ Welcome to ReadOne
            </span>

            <h1 className="mt-6 max-w-4xl text-5xl font-extrabold leading-tight text-gray-900 md:text-6xl">
              Discover Stories that
              <span className="text-blue-600"> Inspire</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Read insightful articles, publish your own ideas, and connect with
              a community of passionate writers from around the world.
            </p>

            {/* Search */}
            <div className="mt-10 w-full max-w-xl">
              <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <Search size={20} className="text-gray-400" />

                <input
                  type="text"
                  placeholder="Search blogs..."
                  className="ml-3 w-full bg-transparent text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Stories */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pb-20 md:px-10 lg:px-14">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Latest Stories</h2>

            <p className="mt-2 text-gray-500">
              Explore what our community is writing today.
            </p>
          </div>

          <button className="rounded-xl border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
            View All
          </button>
        </div>

        {/* Blog Grid */}
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {blogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
