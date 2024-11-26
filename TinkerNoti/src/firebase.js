import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
console.log(process.env.REACT_APP_FIREBASE_API_KEY);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);
const messaging = getMessaging(app);


export const saveTokenToDatabase = (userId, token) => {
  try {
    
    const tokenRef = ref(db, `users/${userId}/fcmToken`);
    console.log("Saving FCM token to:", `users/${userId}/fcmToken`);
    return set(tokenRef, token);
  } catch (error) {
    console.error("Error saving FCM token to database:", error);
  }
};

export const requestPermission = async (userId) => {
  try {
    console.log("Requesting notification permission...");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.error("Permission not granted for notifications");
      return;
    }

    const vapidKey = "BF7Y-jDYwrv-D7JMNVP2lR7axefh10Pc5lzVcmm1y6Gas_1jRLwNpNN2yAbMHSxRz22hoN9cEZQAKhKkJ0G9zfA";
    console.log("Using VAPID key:", vapidKey); // Log the VAPID key for debugging
    const token = await getToken(messaging, { vapidKey });

    if (!token) {
      console.error("Failed to retrieve FCM token");
      return;
    }

    console.log("FCM Token retrieved:", token);
    await saveTokenToDatabase(userId, token); // Save the token in the database
  } catch (error) {
    console.error("Error in requestPermission or saving FCM token:", error);
  }
};

export const onMessageListener = () => new Promise((resolve) => {
  onMessage(messaging, (payload) => resolve(payload));
});

export { auth, googleProvider };
