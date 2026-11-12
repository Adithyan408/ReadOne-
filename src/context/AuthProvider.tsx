import { useEffect, useState, type ReactNode } from "react";
import { type User, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        setDoc(
          doc(db, "users", currentUser.uid),
          {
            uid: currentUser.uid,
            displayName:
              currentUser.displayName ||
              currentUser.email?.split("@")[0] ||
              "Community Member",
            email: currentUser.email || null,
          },
          { merge: true }
        ).catch(() => {
          // ignore Firestore profile sync errors
        });
      }
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;

