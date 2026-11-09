import type { Timestamp } from "firebase/firestore";

export interface Blog {
  id: string;
  title: string;
  description: string;
  content: string;
  author: string;
  userId: string;
  createdAt: Timestamp | null;
  updatedAt?: Timestamp | null;
  likes?: string[];
  likesCount?: number;
  commentsCount?: number;
  savedBy?: string[];
}

export interface Comment {
  id: string;
  blogId: string;
  userId: string;
  userName: string;
  userEmail?: string | null;
  content: string;
  createdAt: Timestamp | null;
  updatedAt?: Timestamp | null;
}
