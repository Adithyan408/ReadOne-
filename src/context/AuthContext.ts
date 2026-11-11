import { createContext, type Dispatch, type SetStateAction } from "react";
import { type User } from "firebase/auth";

export type AuthContextType = {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

