import React, { useState } from "react";
import type { Blog } from "../types/Blog";
import BlogCard from "../Components/BlogCard";

function Home() {
  const [blogs] = useState<Blog[]>([
    {
      id: "1",
      title: "React Hooks",
      description: "Learn React Hooks",
      content: "Full blog content...",
      image: "https://picsum.photos/300/200",
    },
    {
      id: "2",
      title: "TypeScript",
      description: "Learn TypeScript",
      content: "Full blog content...",
      image: "https://picsum.photos/300/200",
    },
  ]);

  return (
    <div>
      {blogs.map((blog) => (
        <BlogCard key={blog.id} blog={blog} />
      ))}
    </div>
  );
}

export default Home;
