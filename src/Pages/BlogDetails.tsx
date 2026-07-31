import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Blog } from "../types/Blog";

function BlogDetails() {
  const { id } = useParams();

  const blogs: Blog[] = [
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
      content: "Very long TypeScript article...",
      image: "https://picsum.photos/300/200",
    },
  ];

  const [blog, setBlog] = useState<Blog | null>(null);

  useEffect(() => {
    const selectedBlog = blogs.find((b) => b.id === id);
    setBlog(selectedBlog ?? null);
  }, [id]);

  if (!blog) {
    return <h2>Blog not found</h2>;
  }

  return (
    <div>
      <img src={blog.image} alt={blog.title} />
      <h1>{blog.title}</h1>
      <p>{blog.content}</p>
    </div>
  );
}

export default BlogDetails;