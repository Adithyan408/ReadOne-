import React, { useState } from "react";
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

  const [prevKey, setPrevKey] = useState<string>("");
  const currentKey = isOpen ? `${mode}_${blog?.id ?? "new"}` : "closed";

  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    if (isOpen) {
      if (mode === "edit" && blog) {
        setTitle(blog.title);
        setContent(blog.content);
      } else {
        setTitle("");
        setContent("");
      }
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateBlog()) return

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
          likes: [],
          likesCount: 0,
          commentsCount: 0,
          comments: [],
          savedBy: [],
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-5">
            <div className="flex h-[92vh] sm:h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200 bg-white shadow-2xl">
              {/* Header */}
                  <div className="flex flex-col gap-3 border-b px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                          {mode === "create" ? "Create New Story" : "Edit Story"}
                        </h2>

                        <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
                          {mode === "create"
                            ? "Share your ideas with the community."
                            : "Update your story."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="rounded-lg p-2 hover:bg-gray-100 sm:hidden shrink-0"
                      >
                        <X size={20} />
                      </button>
                    </div>

                      <div className="flex items-center justify-end gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="flex-1 sm:flex-none rounded-lg border border-gray-300 px-3.5 py-2 text-sm hover:bg-gray-100"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          form="blogForm"
                          className="flex-1 sm:flex-none rounded-lg bg-blue-600 px-4 sm:px-5 py-2 text-sm font-medium text-white"
                        >
                          {mode === "create" ? "Publish" : "Save Changes"}
                        </button>

                        <button
                          type="button"
                          onClick={onClose}
                          aria-label="Close modal"
                          className="hidden sm:inline-flex rounded-lg p-2 hover:bg-gray-100"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>

                    <form
                      id="blogForm"
                      onSubmit={handleSubmit}
                      className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5"
                    >
                      {/* Title */}

                      <input
                        type="text"
                        placeholder="Enter your blog title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border-none text-2xl sm:text-4xl font-bold tracking-tight placeholder:text-gray-300 focus:outline-none"
                      />

                      {/* Editor */}

                      <div className="mt-6">
                        <BlogEditor key={mode === "create" ? "create" : blog?.id} value={content} onChange={setContent} />
                      </div>
                    </form>
                  </div>
                </div>
              </>
              );
}

              export default CreateBlogModal;
