// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth/web-extension";
import { getFirestore } from "firebase/firestore/lite";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1I_5Q6qf7UDx2-AD5zOg3jypnHZKSlV0",
  authDomain: "login-register-783df.firebaseapp.com",
  projectId: "login-register-783df",
  storageBucket: "login-register-783df.firebasestorage.app",
  messagingSenderId: "838932913268",
  appId: "1:838932913268:web:ec220330a9d49a72b0c521"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app)

export const auth = getAuth(app)