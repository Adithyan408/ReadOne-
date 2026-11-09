import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  subscribeToSavedBlogs,
  toggleSaveBlog,
} from "../services/blogService";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { SavedBlogsContext } from "./SavedBlogsContext";

export function SavedBlogsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [savedBlogIds, setSavedBlogIds] = useState<string[]>(() => {
    try {
      const keys = Object.keys(localStorage);
      const key = keys.find((k) => k.startsWith("saved_blogs_"));
      if (key) {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : [];
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

      // 1. Subscribe to users/{user.uid} document
      const unsubUser = subscribeToSavedBlogs(user.uid, (ids) => {
        if (ids && ids.length >= 0) {
          setSavedBlogIds((prev) => {
            const merged = Array.from(new Set([...prev, ...ids]));
            try {
              localStorage.setItem(`saved_blogs_${user.uid}`, JSON.stringify(merged));
            } catch {
              // ignore
            }
            return merged;
          });
          setLoading(false);
        }
      });

      // 2. Also subscribe to blogs collection to sync blogs where savedBy contains user.uid
      const unsubBlogs = onSnapshot(
        collection(db, "blogs"),
        (snapshot) => {
          const idsFromBlogs: string[] = [];
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            if (Array.isArray(data.savedBy) && data.savedBy.includes(user.uid)) {
              idsFromBlogs.push(docSnap.id);
            }
          });

          if (idsFromBlogs.length > 0) {
            setSavedBlogIds((prev) => {
              const merged = Array.from(new Set([...prev, ...idsFromBlogs]));
              try {
                localStorage.setItem(`saved_blogs_${user.uid}`, JSON.stringify(merged));
              } catch {
                // ignore
              }
              return merged;
            });
          }
        },
        (error) => {
          console.warn("Could not sync saved blogs from blogs collection:", error);
        }
      );

      return () => {
        unsubUser();
        unsubBlogs();
      };
    }, [user]);

    const effectiveSavedBlogIds = user ? savedBlogIds : [];

    const isSaved = (blogId: string) => {
      return user ? effectiveSavedBlogIds.includes(blogId) : false;
    };

    const toggleSave = async (blogId: string): Promise<boolean> => {
      if (!user) return false;
      const currentlySaved = isSaved(blogId);

      // Optimistic UI update: instantly update UI so button color flips immediately
      const nextIds = currentlySaved
        ? effectiveSavedBlogIds.filter((id) => id !== blogId)
        : [...effectiveSavedBlogIds, blogId];

      setSavedBlogIds(nextIds);
      try {
        localStorage.setItem(`saved_blogs_${user.uid}`, JSON.stringify(nextIds));
      } catch {
        // ignore
      }

      try {
        await toggleSaveBlog(user.uid, blogId, currentlySaved);
        return true;
      } catch (error) {
        console.error("Failed to toggle save blog:", error);
        // Revert if error
        setSavedBlogIds(effectiveSavedBlogIds);
        return false;
      }
    };

    return (
      <SavedBlogsContext.Provider
        value={{
          savedBlogIds: effectiveSavedBlogIds,
          isSaved,
          toggleSave,
          loading,
        }}
      >
        {children}
      </SavedBlogsContext.Provider>
    );
  }

export default SavedBlogsProvider;
