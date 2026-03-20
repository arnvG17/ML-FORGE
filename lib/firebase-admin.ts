import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let _adminAuth: Auth | null = null;

function getAdminAuth(): Auth {
  if (_adminAuth) return _adminAuth;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "[firebase-admin] Missing FIREBASE_ADMIN_* environment variables. " +
      "Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  let app: App;
  if (getApps().length) {
    app = getApps()[0];
  } else {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        // The private key comes from .env.local and needs newline conversion
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }

  _adminAuth = getAuth(app);
  return _adminAuth;
}

export { getAdminAuth };
