// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, CustomProvider } from "firebase/app-check";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

export const firebaseConfig = {
  apiKey: "AIzaSyB1I_5Q6qf7UDx2-AD5zOg3jypnHZKSlV0",
  authDomain: "login-register-783df.firebaseapp.com",
  projectId: "login-register-783df",
  storageBucket: "login-register-783df.firebasestorage.app",
  messagingSenderId: "838932913268",
  appId: "1:838932913268:web:ec220330a9d49a72b0c521"
};

export const app = initializeApp(firebaseConfig);

// Initialize Firebase App Check if running in browser
if (typeof window !== "undefined") {
  try {
    if (import.meta.env.DEV || import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN) {
      // @ts-expect-error global App Check debug token
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN ?? true;
    }

    initializeAppCheck(app, {
      provider: new CustomProvider({
        getToken: async () => {
          const debugToken = (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }).FIREBASE_APPCHECK_DEBUG_TOKEN;
          if (typeof debugToken === "string") {
            return {
              token: debugToken,
              expireTimeMillis: Date.now() + 60 * 60 * 1000,
            };
          }
          return {
            token: "",
            expireTimeMillis: Date.now(),
          };
        },
      }),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (appCheckErr) {
    console.warn("App Check initialization:", appCheckErr);
  }
}

export const CONFIGURED_GEMINI_MODEL = "gemini-4-hydrogen";
export const ai = getAI(app, { backend: new GoogleAIBackend() });
export const model = getGenerativeModel(ai, { model: CONFIGURED_GEMINI_MODEL });

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);
