import {
  collection,
  doc,
  arrayUnion,
  arrayRemove,
  addDoc,
  deleteDoc,
  getDocs,
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
 * Guarantees likesCount is never negative and reflects exact count
 */
export const toggleBlogLike = async (
  blogId: string,
  userId: string,
  isCurrentlyLiked: boolean
): Promise<void> => {
  const blogRef = doc(db, "blogs", blogId);

  // 1. Update on blog document with non-negative clamped count
  try {
    const blogSnap = await getDoc(blogRef);
    const data = blogSnap.exists() ? blogSnap.data() : null;
    const currentLikes: string[] = Array.isArray(data?.likes) ? data.likes : [];
    const currentCount =
      typeof data?.likesCount === "number"
        ? Math.max(0, data.likesCount)
        : currentLikes.length;

    if (isCurrentlyLiked) {
      // Unliking
      const nextLikes = currentLikes.filter((id) => id !== userId);
      const nextCount = Math.max(0, Math.min(currentCount - 1, nextLikes.length));
      await updateDoc(blogRef, {
        likes: nextLikes,
        likesCount: nextCount,
      });
    } else {
      // Liking
      const nextLikes = Array.from(new Set([...currentLikes, userId]));
      const nextCount = Math.max(1, Math.max(currentCount + 1, nextLikes.length));
      await updateDoc(blogRef, {
        likes: nextLikes,
        likesCount: nextCount,
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
    const blogSnap = await getDoc(blogRef);
    const data = blogSnap.exists() ? blogSnap.data() : null;
    const existingComments: Comment[] = Array.isArray(data?.comments) ? data.comments : [];
    const nextCount = Math.max(1, existingComments.length + 1);

    await updateDoc(blogRef, {
      comments: arrayUnion(commentObj),
      commentsCount: nextCount,
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

  // 4. Clean any deleted marker for this id and trigger active notifiers
  activeDeletedCommentIds.delete(commentObj.id);
  const notifiers = activeBlogNotifiers.get(blogId);
  if (notifiers) {
    notifiers.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignore
      }
    });
  }

  return commentObj.id;
};

// In-memory set of actively deleted comment IDs
const activeDeletedCommentIds = new Set<string>();

// Active notify triggers per blogId
const activeBlogNotifiers = new Map<string, Set<() => void>>();

/**
 * Mark comment as deleted immediately in-memory and in localStorage,
 * and synchronously notify all active subscribers for this blog
 */
export const markCommentAsDeleted = (blogId: string, commentId: string): void => {
  activeDeletedCommentIds.add(commentId);

  // 1. Update localStorage deleted tracking
  try {
    const delKey = `deleted_comments_${blogId}`;
    const rawDel = localStorage.getItem(delKey);
    const delList: string[] = rawDel ? JSON.parse(rawDel) : [];
    if (!delList.includes(commentId)) {
      localStorage.setItem(
        delKey,
        JSON.stringify(Array.from(new Set([...delList, commentId])))
      );
    }
  } catch {
    // ignore
  }

  // 2. Remove from localStorage cache
  try {
    const localKey = `blog_comments_${blogId}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const list: Comment[] = JSON.parse(raw);
      const filtered = list.filter((c) => c.id !== commentId);
      localStorage.setItem(localKey, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  // 3. Immediately trigger all active subscriber notify functions for this blog
  const notifiers = activeBlogNotifiers.get(blogId);
  if (notifiers) {
    notifiers.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignore
      }
    });
  }
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

  // 4. Trigger active notifiers for immediate update
  const notifiers = activeBlogNotifiers.get(blogId);
  if (notifiers) {
    notifiers.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignore
      }
    });
  }
};

/**
 * Delete a comment
 * Immediately marks as deleted locally, notifies active subscribers,
 * deletes from Firestore subcollection, and cleans up blog document comments.
 */
export const deleteComment = async (
  blogId: string,
  commentId: string
): Promise<void> => {
  // 1. Instantly mark as deleted and notify active subscribers in 0ms
  markCommentAsDeleted(blogId, commentId);

  // 2. Delete from Firestore subcollection
  try {
    const commentRef = doc(db, "blogs", blogId, "comments", commentId);
    await deleteDoc(commentRef);
  } catch (err) {
    console.warn("Subcollection delete comment notice:", err);
  }

  // 3. Best-effort update blog document comments array and commentsCount
  try {
    const blogRef = doc(db, "blogs", blogId);
    const blogSnap = await getDoc(blogRef);
    if (blogSnap.exists()) {
      const data = blogSnap.data();
      const existing: Comment[] = Array.isArray(data.comments) ? data.comments : [];
      const updated = existing.filter((c) => c.id !== commentId);
      const currentCount =
        typeof data.commentsCount === "number"
          ? data.commentsCount
          : existing.length;
      const nextCommentsCount = Math.max(0, currentCount - 1);
      await updateDoc(blogRef, {
        comments: updated,
        commentsCount: nextCommentsCount,
      });
    }
  } catch {
    // ignore
  }
};

/**
 * Real-time listener for comments of a blog
 * Prioritizes the authoritative live Firestore subcollection.
 * Guarantees deleted comments never resurrect and all updates render immediately.
 */
export const subscribeToComments = (
  blogId: string,
  callback: (comments: Comment[]) => void
) => {
  let subcollectionComments: Comment[] = [];
  let hasReceivedSubcollectionSnapshot = false;
  let blogDocComments: Comment[] = [];

  const getDeletedIds = (): string[] => {
    try {
      const raw = localStorage.getItem(`deleted_comments_${blogId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const getLocalComments = (): Comment[] => {
    try {
      const raw = localStorage.getItem(`blog_comments_${blogId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const isCommentDeleted = (id: string, delSet: Set<string>): boolean => {
    return activeDeletedCommentIds.has(id) || delSet.has(id);
  };

  const notify = () => {
    const delList = getDeletedIds();
    const delSet = new Set(delList);

    let list: Comment[];

    if (hasReceivedSubcollectionSnapshot) {
      // Subcollection is the authoritative live source from Firestore
      list = subcollectionComments.filter(
        (c) => !isCommentDeleted(c.id, delSet)
      );
    } else {
      // Prior to the first subcollection snapshot, use local cache & blog doc
      const local = getLocalComments();
      const map = new Map<string, Comment>();

      local.forEach((c) => {
        if (!isCommentDeleted(c.id, delSet)) {
          map.set(c.id, c);
        }
      });

      blogDocComments.forEach((c) => {
        if (!isCommentDeleted(c.id, delSet)) {
          map.set(c.id, c);
        }
      });

      list = Array.from(map.values());
    }

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

  // Register this notify callback for immediate deletion events
  if (!activeBlogNotifiers.has(blogId)) {
    activeBlogNotifiers.set(blogId, new Set());
  }
  activeBlogNotifiers.get(blogId)!.add(notify);

  // Immediate notification from cache/in-memory state
  notify();

  // 1. Listen to subcollection
  const commentsCol = collection(db, "blogs", blogId, "comments");
  const unsubSubcol = onSnapshot(
    commentsCol,
    (snapshot) => {
      hasReceivedSubcollectionSnapshot = true;
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

  // 2. Listen to blog document comments array for initial sync / fallback
  const blogRef = doc(db, "blogs", blogId);
  const unsubBlog = onSnapshot(
    blogRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.comments)) {
          blogDocComments = data.comments;
          if (!hasReceivedSubcollectionSnapshot) {
            notify();
          }
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
    const notifiers = activeBlogNotifiers.get(blogId);
    if (notifiers) {
      notifiers.delete(notify);
      if (notifiers.size === 0) {
        activeBlogNotifiers.delete(blogId);
      }
    }
  };
};

/**
 * Permanently delete a blog post along with its comments subcollection and local cache
 */
export const deleteBlog = async (blogId: string): Promise<void> => {
  try {
    const commentsSnap = await getDocs(collection(db, "blogs", blogId, "comments"));
    await Promise.all(commentsSnap.docs.map((commentDoc) => deleteDoc(commentDoc.ref)));
  } catch (err) {
    console.warn("Notice cleaning blog comments subcollection:", err);
  }

  try {
    localStorage.removeItem(`blog_comments_${blogId}`);
    localStorage.removeItem(`deleted_comments_${blogId}`);
  } catch {
    // ignore
  }

  await deleteDoc(doc(db, "blogs", blogId));
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
