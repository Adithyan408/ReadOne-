import React, { useEffect, useState } from "react";
import type { Blog, Comment } from "../types/Blog";
import { useAuth } from "../hooks/useAuth";
import {
  addComment,
  deleteComment,
  subscribeToComments,
  updateComment,
} from "../services/blogService";
import DeleteConfirmationModal from "./deleteModal";
import {
  MessageCircle,
  Pencil,
  Trash2,
  Send,
  X,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  blog: Blog;
};

const formatCommentDate = (createdAt: unknown) => {
  if (!createdAt) return "Just now";
  let date: Date;
  if (
    typeof createdAt === "object" &&
    createdAt !== null &&
    "toDate" in createdAt &&
    typeof (createdAt as { toDate: () => Date }).toDate === "function"
  ) {
    date = (createdAt as { toDate: () => Date }).toDate();
  } else if (createdAt instanceof Date) {
    date = createdAt;
  } else if (typeof createdAt === "string" || typeof createdAt === "number") {
    date = new Date(createdAt);
  } else {
    return "Just now";
  }

  if (isNaN(date.getTime())) return "Just now";

  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

function CommentSection({ blog }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>(blog.comments || []);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [inputError, setInputError] = useState("");
  const deletedCommentIdsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!blog.id) return;
    const unsubscribe = subscribeToComments(blog.id, (fetchedComments) => {
      setComments(
        fetchedComments.filter((c) => !deletedCommentIdsRef.current.has(c.id))
      );
    });

    return () => unsubscribe();
  }, [blog.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmed = newComment.trim();
    if (!trimmed) {
      setInputError("Comment cannot be empty.");
      return;
    }

    setInputError("");
    setIsSubmitting(true);

    const tempId = `temp_${Date.now()}`;
    const optimisticComment: Comment = {
      id: tempId,
      blogId: blog.id,
      userId: user.uid,
      userName: user.displayName || user.email?.split("@")[0] || "You",
      userEmail: user.email || null,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    // Optimistically show comment immediately
    setComments((prev) => [optimisticComment, ...prev]);
    setNewComment("");

    try {
      const realId = await addComment(
        blog.id,
        {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
        },
        trimmed
      );

      if (realId && realId !== tempId) {
        setComments((prev) =>
          prev.map((c) => (c.id === tempId ? { ...c, id: realId } : c))
        );
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (commentId: string) => {
    const trimmed = editContent.trim();
    if (!trimmed) return;

    setIsSavingEdit(true);
    // Optimistically update local comments state so the comment content is immediately updated
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, content: trimmed, updatedAt: new Date().toISOString() }
          : c
      )
    );
    setEditingCommentId(null);
    setEditContent("");

    try {
      await updateComment(blog.id, commentId, trimmed);
    } catch (error) {
      console.error("Failed to update comment:", error);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete) return;
    const idToDelete = commentToDelete.id;
    deletedCommentIdsRef.current.add(idToDelete);
    // Optimistically remove from local comments state immediately
    setComments((prev) => prev.filter((c) => c.id !== idToDelete));
    setCommentToDelete(null);

    try {
      await deleteComment(blog.id, idToDelete);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  return (
    <div id="comments-section" className="mt-12 pt-8 border-t border-gray-200">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!commentToDelete}
        title="Delete Comment"
        message={
          commentToDelete && user?.uid === blog.userId && user?.uid !== commentToDelete.userId
            ? `As the blog author, are you sure you want to delete this comment by "${commentToDelete.userName}"?`
            : "Are you sure you want to permanently delete your comment?"
        }
        onClose={() => setCommentToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <MessageCircle size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Discussion</h3>
            <p className="text-sm text-gray-500">
              {Math.max(0, comments.length)} {Math.max(0, comments.length) === 1 ? "comment" : "comments"}
            </p>
          </div>
        </div>
      </div>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleAddComment} className="mb-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white uppercase">
                {(user.displayName || user.email || "U")[0]}
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {user.displayName || user.email?.split("@")[0] || "User"}
              </span>
              {user.uid === blog.userId && (
                <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                  <ShieldCheck size={12} />
                  Author
                </span>
              )}
            </div>

            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                if (inputError) setInputError("");
              }}
              placeholder="What are your thoughts? Share with the community..."
              className="w-full resize-none border-none bg-transparent p-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden"
            />

            {inputError && (
              <p className="mt-2 text-xs font-medium text-red-600">{inputError}</p>
            )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {newComment.length > 0 ? `${newComment.length} characters` : ""}
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 sm:px-4 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={14} />
                  {isSubmitting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
        </form>
      ) : (
          <div className="mb-8 sm:mb-10 rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-5 sm:p-6 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Join the conversation! Log in to share your thoughts.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-blue-700"
            >
              Log in to comment
            </Link>
          </div>
      )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 py-12 text-center">
                <MessageCircle className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-base font-medium text-gray-600">No comments yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Be the first to share what you think about this story.
                </p>
              </div>
            ) : (
              comments.map((comment) => {
                const isOwner = user?.uid === comment.userId;
                const isBlogAuthor = user?.uid === blog.userId;
                const isEditing = editingCommentId === comment.id;
                const isCommentByBlogAuthor = comment.userId === blog.userId;

                return (
                  <div
                    key={comment.id}
                    className={`rounded-2xl border p-4 transition-all ${isEditing
                      ? "border-blue-300 bg-blue-50/20"
                      : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                  >
                    {/* Comment Header */}
                          <div className="flex items-start justify-between gap-2 sm:gap-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-bold text-white uppercase shadow-xs">
                                {comment.userName ? comment.userName[0] : "U"}
                              </div>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                        <span className="truncate text-sm font-semibold text-gray-800">
                                          {comment.userName}
                                        </span>
                                        {isCommentByBlogAuthor && (
                                          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                            Author
                                          </span>
                                        )}
                                      </div>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400">
                                          <span>{formatCommentDate(comment.createdAt)}</span>
                                          {comment.updatedAt && (
                                            <span className="text-[11px] text-gray-400 italic">
                                              (edited)
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Actions: Edit / Delete */}
                                      <div className="flex shrink-0 items-center gap-1">
                                        {/* Owner can edit */}
                                        {isOwner && !isEditing && (
                                          <button
                                            type="button"
                                            onClick={() => handleStartEdit(comment)}
                                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition"
                                            title="Edit comment"
                                          >
                                            <Pencil size={14} />
                                          </button>
                                        )}

                                        {/* Owner or Blog Author can delete */}
                                        {(isOwner || isBlogAuthor) && !isEditing && (
                                          <button
                                            type="button"
                                            onClick={() => setCommentToDelete(comment)}
                                            className={`rounded-lg p-1.5 transition ${!isOwner && isBlogAuthor
                                              ? "text-red-400 hover:bg-red-50 hover:text-red-600"
                                              : "text-gray-400 hover:bg-gray-100 hover:text-red-600"
                                              }`}
                                            title={
                                              !isOwner && isBlogAuthor
                                                ? "Delete as Blog Author"
                                                : "Delete comment"
                                            }
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Comment Content / Edit Mode */}
                                      <div className="mt-3 pl-0 sm:pl-10.5">
                                        {isEditing ? (
                                          <div className="space-y-2">
                                            <textarea
                                              rows={3}
                                              value={editContent}
                                              onChange={(e) => setEditContent(e.target.value)}
                                              className="w-full rounded-xl border border-blue-300 bg-white p-3 text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-200"
                                            />
                                            <div className="flex items-center justify-end gap-2">
                                              <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                disabled={isSavingEdit}
                                                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                                              >
                                                <X size={13} />
                                                Cancel
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleSaveEdit(comment.id)}
                                                disabled={isSavingEdit || !editContent.trim()}
                                                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
                                              >
                                                <Check size={13} />
                                                {isSavingEdit ? "Saving..." : "Save"}
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                            <p className="break-words text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                                              {comment.content}
                                            </p>
                  )}
                                          </div>
              </div>
                                      );
          })
        )}
                                    </div>
                                </div>
                                );
}

                                export default CommentSection;