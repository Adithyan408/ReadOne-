import BlogCard from "../Components/BlogCard";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { BookOpen } from "lucide-react";

import { useEffect, useState } from "react";
import type { Blog } from "../types/Blog";
import { useAuth } from "../hooks/useAuth";
type Props = {
  onCreate: () => void;
};
function Home({ onCreate }: Props) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "blogs"), (snapshot) => {
      const blogsData: Blog[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Blog, "id">),
      }));

      setBlogs(blogsData);
      setLoading(false);
    });

    return () => unsubscribe();
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
          </div>
        </div>
      </section>

      {/* Latest Stories */}
      {blogs.length > 0 ? (
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

          <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        </section>
      ) : (
        <section className="mx-auto flex min-h-[420px] w-full max-w-[1200px] items-center justify-center px-6 pb-24">
          <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              <BookOpen className="h-10 w-10 text-blue-600" />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-800">
              No Blogs Yet
            </h2>

            <p className="mt-3 text-gray-500">
              There are no published stories at the moment. Be the first to
              share your ideas with the community.
            </p>

            {user ? (
              <button
                onClick={onCreate} // or setIsModalOpen(true)
                className="mt-8 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                Write the First Story
              </button>
            ) : (
              <p className="mt-4 text-black-800">Login to Continue</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;
