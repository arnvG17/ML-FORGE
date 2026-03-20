import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBr0JcU0Pcb6iyGW31zPxFwSCB7_lnHO4Y",
  authDomain: "forge-10296.firebaseapp.com",
  projectId: "forge-10296",
  storageBucket: "forge-10296.firebasestorage.app",
  messagingSenderId: "650794637538",
  appId: "1:650794637538:web:db2f901f23fbee386f66bb",
  measurementId: "G-TT3KQ3BJQP"
};

// Only initialize Firebase if we have config (avoids build-time errors with empty env vars)
let app: FirebaseApp | undefined;
let auth: Auth;
let googleProvider: GoogleAuthProvider;

function ensureFirebase() {
  if (app) return;

  if (!firebaseConfig.apiKey) {
    console.warn("[firebase] Missing NEXT_PUBLIC_FIREBASE_API_KEY — Firebase not initialized.");
    return;
  }

  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

// Lazy getters that ensure initialization
function getFirebaseAuth(): Auth {
  ensureFirebase();
  return auth;
}

function getGoogleProvider(): GoogleAuthProvider {
  ensureFirebase();
  return googleProvider;
}

export { getFirebaseAuth, getGoogleProvider };
