import { Link } from "react-router-dom";
import type { Blog } from "../types/Blog";

type Props = {
  blog: Blog;
};

function BlogCard({ blog }: Props) {
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
          {blog.description}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="font-medium text-blue-600 transition-transform duration-300 group-hover:translate-x-1">
            Read More →
          </span>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
            5 min read
          </span>
        </div>
      </div>
    </Link>
  );
}

export default BlogCard;