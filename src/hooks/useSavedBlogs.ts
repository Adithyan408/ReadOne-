import { useContext } from "react";
import { SavedBlogsContext } from "../context/SavedBlogsContext";

export function useSavedBlogs() {
  const context = useContext(SavedBlogsContext);
  if (!context) {
    throw new Error("useSavedBlogs must be used within a SavedBlogsProvider");
  }
  return context;
}

