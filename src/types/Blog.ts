import type { Timestamp } from "firebase/firestore";

export interface Blog {
  id: string;
  title: string;
  description: string;
  content: string;
  author: string;
  userId: string;
  createdAt: Timestamp;
}
