import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import BlogEditor from "./BlogEditor";
import { db } from "../firebase/firebase";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import type { Blog } from "../types/Blog";
import AlertModal from "./AlertModal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  blog?: Blog;
};

function CreateBlogModal({ isOpen, onClose, mode, blog }: Props) {
  const [title, setTitle] = useState(blog?.title ?? "");
  const [content, setContent] = useState(blog?.content ?? "");
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const auth = getAuth();

  const validateBlog = () => {
  const trimmedTitle = title.trim();
  const plainText = content.replace(/<[^>]*>/g, "").trim();

  if (!trimmedTitle) {
    setErrorMessage("Blog title cannot be empty.");
    setShowErrorModal(true);
    return false;
  }

  if (!plainText) {
    setErrorMessage("Blog content cannot be empty.");
    setShowErrorModal(true);
    return false;
  }

  return true;
};

  useEffect(() => {
    if (mode === "edit" && blog) {
      setTitle(blog.title);
      setContent(blog.content);
    }

    if (mode === "create") {
      setTitle("");
      setContent("");
    }
  }, [mode, blog]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if(!validateBlog()) return

    try {
      if (mode === "create") {
        const blogRef = doc(collection(db, "blogs"));

        await setDoc(blogRef, {
          id: blogRef.id,
          title,
          description: content.slice(0, 150),
          content,
          userId: auth.currentUser?.uid,
          author: auth.currentUser?.displayName ?? "Anonymous",
          createdAt: serverTimestamp(),
        });
      } else if (mode === "edit" && blog) {
        await updateDoc(doc(db, "blogs", blog.id), {
          title,
          description: content.slice(0, 150),
          content,
          updatedAt: serverTimestamp(),
        });
      }

      onClose();
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
    <AlertModal
        isOpen={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-5">
      <div className="flex h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {mode === "create" ? "Create New Story" : "Edit Story"}
            </h2>

            <p className="mt-0.5 text-sm text-gray-500">
              {mode === "create"
                ? "Share your ideas with the community."
                : "Update your story."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="blogForm"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white"
            >
              {mode === "create" ? "Publish" : "Save Changes"}
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form
          id="blogForm"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          {/* Title */}

          <input
            type="text"
            placeholder="Enter your blog title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-none text-4xl font-bold tracking-tight placeholder:text-gray-300 focus:outline-none"
          />

          {/* Editor */}

          <div className="mt-6">
            <BlogEditor value={content} onChange={setContent} />
          </div>
        </form>
      </div>
    </div>
    </>
  );
}

export default CreateBlogModal;
