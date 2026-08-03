import { Link } from "react-router-dom";
import type { Blog } from "../types/Blog";

type Props = {
  blog: Blog;
};

const formatPublishedDate = (createdAt: any) => {
  const date = createdAt.toDate(); // Firestore Timestamp
  const now = new Date();

  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function BlogCard({ blog }: Props) {
  const plainText = blog.description.replace(/<[^>]*>/g, "");
  return (
    <Link
      to={`/blog/${blog.id}`}
      className="group flex h-full w-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
    >
      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <h2 className="line-clamp-2 text-2xl font-bold leading-tight text-gray-800 transition-colors duration-300 group-hover:text-blue-600">
          {blog.title}
        </h2>

        <p className="mt-4 line-clamp-3 flex-1 text-[15px] leading-7 text-gray-600">
          {plainText}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="font-medium text-blue-600 transition-transform duration-300 group-hover:translate-x-1">
            Read More →
          </span>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
            Published {formatPublishedDate(blog.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default BlogCard;
