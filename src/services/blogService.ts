import {
  collection,
  doc,
  arrayUnion,
  arrayRemove,
  increment,
  addDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import type { Comment } from "../types/Blog";

/**
 * Toggle like for a blog
 * Updates blog document, user document, and localStorage
 */
export const toggleBlogLike = async (
  blogId: string,
  userId: string,
  isCurrentlyLiked: boolean
): Promise<void> => {
  const blogRef = doc(db, "blogs", blogId);

  // 1. Update on blog document
  try {
    if (isCurrentlyLiked) {
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
  } catch {
    // If updateDoc is restricted by rules, try setDoc with merge
    try {
      if (isCurrentlyLiked) {
        await setDoc(blogRef, { likes: arrayRemove(userId) }, { merge: true });
      } else {
        await setDoc(blogRef, { likes: arrayUnion(userId) }, { merge: true });
      }
    } catch {
      // ignore
    }
  }

  // 2. Persist in user document
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        likedBlogs: isCurrentlyLiked ? arrayRemove(blogId) : arrayUnion(blogId),
      },
      { merge: true }
    );
  } catch {
    // ignore
  }

  // 3. Persist in localStorage for instant retrieval
  try {
    const likedKey = `liked_blogs_${userId}`;
    const unlikedKey = `unliked_blogs_${userId}`;

    const likedRaw = localStorage.getItem(likedKey);
    const likedList: string[] = likedRaw ? JSON.parse(likedRaw) : [];
    const unlikedRaw = localStorage.getItem(unlikedKey);
    const unlikedList: string[] = unlikedRaw ? JSON.parse(unlikedRaw) : [];

    if (isCurrentlyLiked) {
      // Was liked, now unliking
      localStorage.setItem(
        likedKey,
        JSON.stringify(likedList.filter((id) => id !== blogId))
      );
      localStorage.setItem(
        unlikedKey,
        JSON.stringify(Array.from(new Set([...unlikedList, blogId])))
      );
    } else {
      // Was unliked, now liking
      localStorage.setItem(
        likedKey,
        JSON.stringify(Array.from(new Set([...likedList, blogId])))
      );
      localStorage.setItem(
        unlikedKey,
        JSON.stringify(unlikedList.filter((id) => id !== blogId))
      );
    }
  } catch {
    // ignore
  }
};

/**
 * Add a comment to a blog
 * Supports subcollection, blog document comments array, and local cache
 */
export const addComment = async (
  blogId: string,
  user: { uid: string; displayName?: string | null; email?: string | null },
  content: string
): Promise<string> => {
  const commentId = `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const commentObj: Comment = {
    id: commentId,
    blogId,
    userId: user.uid,
    userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
    userEmail: user.email || null,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  // 1. Try writing to subcollection 'blogs/{blogId}/comments'
  try {
    const commentsRef = collection(db, "blogs", blogId, "comments");
    const docRef = await addDoc(commentsRef, {
      blogId,
      userId: user.uid,
      userName: commentObj.userName,
      userEmail: commentObj.userEmail,
      content: commentObj.content,
      createdAt: serverTimestamp(),
    });
    commentObj.id = docRef.id;
  } catch (err) {
    console.warn("Subcollection comment add notice:", err);
  }

  // 2. Also try writing to blog document comments array
  try {
    const blogRef = doc(db, "blogs", blogId);
    await updateDoc(blogRef, {
      comments: arrayUnion(commentObj),
      commentsCount: increment(1),
    });
  } catch {
    try {
      const blogRef = doc(db, "blogs", blogId);
      await setDoc(
        blogRef,
        {
          comments: arrayUnion(commentObj),
        },
        { merge: true }
      );
    } catch {
      // ignore
    }
  }

  // 3. Persist in localStorage cache for resilience
  try {
    const localKey = `blog_comments_${blogId}`;
    const raw = localStorage.getItem(localKey);
    const existing: Comment[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(localKey, JSON.stringify([commentObj, ...existing]));
  } catch {
    // ignore
  }

  return commentObj.id;
};

/**
 * Update an existing comment
 */
export const updateComment = async (
  blogId: string,
  commentId: string,
  content: string
): Promise<void> => {
  const trimmed = content.trim();

  // 1. Try subcollection update
  try {
    const commentRef = doc(db, "blogs", blogId, "comments", commentId);
    await updateDoc(commentRef, {
      content: trimmed,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Subcollection update comment notice:", err);
  }

  // 2. Try blog document update
  try {
    const blogRef = doc(db, "blogs", blogId);
    const blogSnap = await getDoc(blogRef);
    if (blogSnap.exists()) {
      const data = blogSnap.data();
      const existing: Comment[] = Array.isArray(data.comments) ? data.comments : [];
      const updated = existing.map((c) =>
        c.id === commentId
          ? { ...c, content: trimmed, updatedAt: new Date().toISOString() }
          : c
      );
      await updateDoc(blogRef, { comments: updated });
    }
  } catch {
    // ignore
  }

  // 3. Update localStorage cache
  try {
    const localKey = `blog_comments_${blogId}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const list: Comment[] = JSON.parse(raw);
      const updated = list.map((c) =>
        c.id === commentId
          ? { ...c, content: trimmed, updatedAt: new Date().toISOString() }
          : c
      );
      localStorage.setItem(localKey, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (
  blogId: string,
  commentId: string
): Promise<void> => {
  // 1. Try subcollection delete
  try {
    const commentRef = doc(db, "blogs", blogId, "comments", commentId);
    await deleteDoc(commentRef);
  } catch (err) {
    console.warn("Subcollection delete comment notice:", err);
  }

  // 2. Try blog document update
  try {
    const blogRef = doc(db, "blogs", blogId);
    const blogSnap = await getDoc(blogRef);
    if (blogSnap.exists()) {
      const data = blogSnap.data();
      const existing: Comment[] = Array.isArray(data.comments) ? data.comments : [];
      const updated = existing.filter((c) => c.id !== commentId);
      await updateDoc(blogRef, {
        comments: updated,
        commentsCount: increment(-1),
      });
    }
  } catch {
    // ignore
  }

  // 3. Delete from localStorage cache
  try {
    const localKey = `blog_comments_${blogId}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const list: Comment[] = JSON.parse(raw);
      const updated = list.filter((c) => c.id !== commentId);
      localStorage.setItem(localKey, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
};

/**
 * Real-time listener for comments of a blog
 * Merges subcollection, blog doc comments array, and local cache
 */
export const subscribeToComments = (
  blogId: string,
  callback: (comments: Comment[]) => void
) => {
  let subcollectionComments: Comment[] = [];
  let blogDocComments: Comment[] = [];

  const getLocalComments = (): Comment[] => {
    try {
      const raw = localStorage.getItem(`blog_comments_${blogId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const notify = () => {
    const local = getLocalComments();
    const map = new Map<string, Comment>();

    // 1. First add local comments
    local.forEach((c) => map.set(c.id, c));

    // 2. Add blog doc comments
    blogDocComments.forEach((c) => map.set(c.id, c));

    // 3. Add subcollection comments (highest authority)
    subcollectionComments.forEach((c) => map.set(c.id, c));

    const list = Array.from(map.values());

    // Sort by createdAt descending (newest first)
    list.sort((a, b) => {
      const getMillis = (val: unknown) => {
        if (!val) return Date.now();
        if (
          typeof val === "object" &&
          val !== null &&
          "toDate" in val &&
          typeof (val as { toDate: () => Date }).toDate === "function"
        ) {
          return (val as { toDate: () => Date }).toDate().getTime();
        }
        if (val instanceof Date) return val.getTime();
        if (typeof val === "string" || typeof val === "number") {
          const t = new Date(val).getTime();
          return isNaN(t) ? Date.now() : t;
        }
        return Date.now();
      };
      return getMillis(b.createdAt) - getMillis(a.createdAt);
    });

    callback(list);
  };

  // Immediate notification from cache
  notify();

  // 1. Listen to subcollection
  const commentsCol = collection(db, "blogs", blogId, "comments");
  const unsubSubcol = onSnapshot(
    commentsCol,
    (snapshot) => {
      subcollectionComments = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          blogId,
          userId: data.userId || "",
          userName: data.userName || "Anonymous",
          userEmail: data.userEmail || null,
          content: data.content || "",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });
      notify();
    },
    (error) => {
      console.warn("Notice on comments subcollection listener:", error);
    }
  );

  // 2. Listen to blog document comments array
  const blogRef = doc(db, "blogs", blogId);
  const unsubBlog = onSnapshot(
    blogRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.comments)) {
          blogDocComments = data.comments;
          notify();
        }
      }
    },
    (error) => {
      console.warn("Notice on blog document comments listener:", error);
    }
  );

  return () => {
    unsubSubcol();
    unsubBlog();
  };
};

/**
 * Toggle bookmark/save for a blog by a user
 */
export const toggleSaveBlog = async (
  userId: string,
  blogId: string,
  isCurrentlySaved: boolean
): Promise<void> => {
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

  try {
    const blogRef = doc(db, "blogs", blogId);
    await setDoc(
      blogRef,
      {
        savedBy: isCurrentlySaved ? arrayRemove(userId) : arrayUnion(userId),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not update savedBy on blog doc:", err);
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
      console.warn("Notice on saved blogs listener:", error);
      callback([]);
    }
  );
};
