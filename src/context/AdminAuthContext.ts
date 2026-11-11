import { createContext } from "react";

export interface AdminAuthContextType {
  isAdmin: boolean;
  adminUsername: string | null;
  login: (
    username: string,
    password: string
  ) => { success: boolean; error?: string };
  logout: () => void;
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

