import admin from "firebase-admin";

const parseServiceAccount = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.private_key) {
      parsed.private_key = String(parsed.private_key).replace(/\\n/g, "\n");
    }
    return parsed;
  } catch (error) {
    console.error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON:", error?.message);
    return null;
  }
};

export const getFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin;
  }
  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) {
    return null;
  }
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return admin;
  } catch (error) {
    console.error("Firebase Admin init failed:", error?.message);
    return null;
  }
};

