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
import type { Timestamp } from "firebase/firestore";

type Props = {
  blog: Blog;
};

const formatCommentDate = (createdAt: Timestamp | null | undefined) => {
  if (!createdAt) return "Just now";
  const date = createdAt.toDate();
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [inputError, setInputError] = useState("");

  useEffect(() => {
    if (!blog.id) return;
    const unsubscribe = subscribeToComments(blog.id, (fetchedComments) => {
      setComments(fetchedComments);
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
    try {
      await addComment(
        blog.id,
        {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
        },
        trimmed
      );
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
      setInputError("Failed to post comment. Please try again.");
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
    try {
      await updateComment(blog.id, commentId, trimmed);
      setEditingCommentId(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to update comment:", error);
      alert("Failed to update comment. Please try again.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete) return;
    try {
      await deleteComment(blog.id, commentToDelete.id);
      setCommentToDelete(null);
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("Failed to delete comment. Please try again.");
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
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
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

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                {newComment.length > 0 ? `${newComment.length} characters` : ""}
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={14} />
                {isSubmitting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-10 rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-6 text-center">
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
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-bold text-white uppercase shadow-xs">
                      {comment.userName ? comment.userName[0] : "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {comment.userName}
                        </span>
                        {isCommentByBlogAuthor && (
                          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            Author
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
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
                  <div className="flex items-center gap-1">
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
                <div className="mt-3 pl-10.5">
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
                    <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
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