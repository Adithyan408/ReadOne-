import { Link } from "react-router-dom"
import type { Blog } from "../types/Blog"

type Props = {
    blog:Blog
}


function BlogCard({blog}:Props) {
  return (
    <div>
      <img
            src={blog.image}
            />

            <h1>{blog.title}</h1>

            <p>{blog.description}</p>

            <Link
            to={`/blog/${blog.id}`}
            >
                Read More
            </Link>

    </div>
  )
}

export default BlogCard
