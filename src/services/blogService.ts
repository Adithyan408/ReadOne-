import {
  collection,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import type { Comment } from "../types/Blog";

/**
 * Toggle like for a blog
 */
export const toggleBlogLike = async (
  blogId: string,
  userId: string,
  isLiked: boolean
): Promise<void> => {
  const blogRef = doc(db, "blogs", blogId);
  if (isLiked) {
    await updateDoc(blogRef, {
      likes: arrayRemove(userId),
      likesCount: increment(-1),
    });
  } else {
    await updateDoc(blogRef, {
      likes: arrayUnion(userId),
      likesCount: increment(1),
    });
  }
};

/**
 * Add a comment to a blog
 */
export const addComment = async (
  blogId: string,
  user: { uid: string; displayName?: string | null; email?: string | null },
  content: string
): Promise<void> => {
  const commentsRef = collection(db, "blogs", blogId, "comments");
  await addDoc(commentsRef, {
    blogId,
    userId: user.uid,
    userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
    userEmail: user.email || null,
    content: content.trim(),
    createdAt: serverTimestamp(),
  });

  const blogRef = doc(db, "blogs", blogId);
  await updateDoc(blogRef, {
    commentsCount: increment(1),
  });
};

/**
 * Update an existing comment
 */
export const updateComment = async (
  blogId: string,
  commentId: string,
  content: string
): Promise<void> => {
  const commentRef = doc(db, "blogs", blogId, "comments", commentId);
  await updateDoc(commentRef, {
    content: content.trim(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Delete a comment
 */
export const deleteComment = async (
  blogId: string,
  commentId: string
): Promise<void> => {
  const commentRef = doc(db, "blogs", blogId, "comments", commentId);
  await deleteDoc(commentRef);

  const blogRef = doc(db, "blogs", blogId);
  await updateDoc(blogRef, {
    commentsCount: increment(-1),
  });
};

/**
 * Real-time listener for comments of a blog
 */
export const subscribeToComments = (
  blogId: string,
  callback: (comments: Comment[]) => void
) => {
  const commentsQuery = query(
    collection(db, "blogs", blogId, "comments"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    commentsQuery,
    (snapshot) => {
      const comments: Comment[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        blogId,
        ...(docSnap.data() as Omit<Comment, "id" | "blogId">),
      }));
      callback(comments);
    },
    (error) => {
      console.error("Error listening to comments:", error);
    }
  );
};

/**
 * Toggle bookmark/save for a blog by a user
 */
export const toggleSaveBlog = async (
  userId: string,
  blogId: string,
  isCurrentlySaved: boolean
): Promise<void> => {
  // 1. Update the blog document in 'blogs' collection
  try {
    const blogRef = doc(db, "blogs", blogId);
    await updateDoc(blogRef, {
      savedBy: isCurrentlySaved ? arrayRemove(userId) : arrayUnion(userId),
    });
  } catch (err) {
    console.warn("Could not update savedBy on blog doc:", err);
  }

  // 2. Also update 'users' collection document
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        savedBlogs: isCurrentlySaved ? arrayRemove(blogId) : arrayUnion(blogId),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not update savedBlogs on user doc:", err);
  }
};

/**
 * Real-time listener for user's saved blog IDs
 */
export const subscribeToSavedBlogs = (
  userId: string,
  callback: (savedBlogIds: string[]) => void
) => {
  const userRef = doc(db, "users", userId);
  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback(data.savedBlogs || []);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.error("Error subscribing to saved blogs:", error);
      callback([]);
    }
  );
};

