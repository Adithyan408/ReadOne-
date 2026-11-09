import { createContext } from "react";

export interface SavedBlogsContextType {
  savedBlogIds: string[];
  isSaved: (blogId: string) => boolean;
  toggleSave: (blogId: string) => Promise<boolean>;
  loading: boolean;
}

export const SavedBlogsContext = createContext<SavedBlogsContextType | null>(
  null
);

