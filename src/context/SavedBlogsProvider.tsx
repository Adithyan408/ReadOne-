import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  subscribeToSavedBlogs,
  toggleSaveBlog,
} from "../services/blogService";
import { SavedBlogsContext } from "./SavedBlogsContext";

export function SavedBlogsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [savedBlogIds, setSavedBlogIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeToSavedBlogs(user.uid, (ids) => {
      setSavedBlogIds(ids);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const effectiveSavedBlogIds = user ? savedBlogIds : [];

  const isSaved = (blogId: string) => {
    return effectiveSavedBlogIds.includes(blogId);
  };

  const toggleSave = async (blogId: string): Promise<boolean> => {
    if (!user) return false;
    const currentlySaved = isSaved(blogId);
    try {
      await toggleSaveBlog(user.uid, blogId, currentlySaved);
      return true;
    } catch (error) {
      console.error("Failed to toggle save blog:", error);
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

