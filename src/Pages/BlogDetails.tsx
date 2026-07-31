import { ArrowLeft, CalendarDays, Clock3, User } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Blog } from "../types/Blog";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

function BlogDetails() {
  const { id } = useParams();

  const [blog, setBlog] = useState<Blog | null>(null);

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
      }
    };

    fetchBlog();
  }, [id]);
  if (!blog) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F6F2]">
        <h2 className="text-2xl font-semibold text-gray-600">Blog not found</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      {/* Hero */}

      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 -z-10 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl"></div>

        <div className="mx-auto max-w-5xl px-6 py-12">
          {/* Back */}

          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            <ArrowLeft size={18} />
            Back to Blogs
          </Link>

          {/* Image */}


        </div>
      </section>

      {/* Content */}

      <section className="mx-auto max-w-3xl px-6 pb-20">
        {/* Title */}

        <h1 className="mt-10 text-5xl font-extrabold leading-tight text-gray-900">
          {blog.title}
        </h1>

        {/* Meta */}

        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <User size={16} />
            {blog.author}
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays size={16} />
            {new Date(blog.createdAt).toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>

          <div className="flex items-center gap-2">
            <Clock3 size={16} />5 min read
          </div>
        </div>

        {/* Divider */}

        <div className="my-10 h-px bg-gray-200"></div>

        {/* Blog Content */}

        <article
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </section>
    </div>
  );
}

export default BlogDetails;
