import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBq1WZIMK33fvFHhwsnI-T1MnpdmUbUy5s",
  authDomain: "tinkeringfalldetection.firebaseapp.com",
  databaseURL: "https://tinkeringfalldetection-default-rtdb.firebaseio.com/",
  projectId: "tinkeringfalldetection",
  storageBucket: "tinkeringfalldetection.firebasestorage.app",
  messagingSenderId: "664584080885",
  appId: "1:664584080885:web:bff8b873cbd5609a9664bc",
  measurementId: "G-2SDR8JYY2X"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
const messaging = getMessaging(app);

export const saveTokenToDatabase = (userId, token) => {
  const tokenRef = ref(db, `users/${userId}/fcmToken`);
  return set(tokenRef, token);
};

export const requestPermission = async (userId) => {
  try {
    await Notification.requestPermission();
    const token = await getToken(messaging, { vapidKey: "YOUR_ACTUAL_VAPID_KEY" });
    if (token) {
      console.log("FCM Token:", token);
      await saveTokenToDatabase(userId, token);  // Save token with user ID in the database
    }
  } catch (error) {
    console.error("Permission denied or error:", error);
  }
};

export const onMessageListener = () => 
  new Promise((resolve) => {
    onMessage(messaging, (payload) => resolve(payload));
  });
