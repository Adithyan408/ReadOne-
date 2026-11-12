import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  type UserCredential,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

const googleProvider = new GoogleAuthProvider();

const syncUserProfileDoc = async (
  uid: string,
  displayName: string | null | undefined,
  email: string | null | undefined
) => {
  try {
    await setDoc(
      doc(db, "users", uid),
      {
        uid,
        displayName:
          displayName || email?.split("@")[0] || "Community Member",
        email: email || null,
      },
      { merge: true }
    );
  } catch {
    // ignore profile sync errors
  }
};

/**
 * Create account with Email & Password
 */
export const signup = async (
  name: string,
  email: string,
  password: string
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  if (auth.currentUser) {
    await updateProfile(auth.currentUser, {
      displayName: name,
    });
  }

  await syncUserProfileDoc(userCredential.user.uid, name, email);

  return userCredential;
};

/**
 * Login with Email & Password
 */
export const login = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await syncUserProfileDoc(
    credential.user.uid,
    credential.user.displayName,
    credential.user.email
  );
  return credential;
};

/**
 * Login / Signup with Google
 */
export const loginWithGoogle = async (): Promise<UserCredential> => {
  const credential = await signInWithPopup(auth, googleProvider);
  await syncUserProfileDoc(
    credential.user.uid,
    credential.user.displayName,
    credential.user.email
  );
  return credential;
};

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * Send Password Reset Email
 */
export const resetPassword = async (
  email: string
): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};