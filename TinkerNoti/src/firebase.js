import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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

export const requestPermission = async () => {
  try {
    await Notification.requestPermission();
    const token = await getToken(messaging, { vapidKey: "YOUR_VAPID_KEY" });
    if (token) {
      console.log("FCM Token:", token);
      // Save this token in your database to send notifications to this user
    }
  } catch (error) {
    console.error("Permission denied or error:", error);
  }
};

export const onMessageListener = () => 
  new Promise((resolve) => {
    onMessage(messaging, (payload) => resolve(payload));
  });