import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCe04hLwThhVOCfIlSUuCKXDpLW1V2wuGw",
  authDomain: "tinkering24-88f4d.firebaseapp.com",
  databaseURL: "https://tinkering24-88f4d-default-rtdb.firebaseio.com",
  projectId: "tinkering24-88f4d",
  storageBucket: "tinkering24-88f4d.firebasestorage.app",
  messagingSenderId: "1066192862886",
  appId: "1:1066192862886:web:8f2cb0d719305459ad7e67",
  measurementId: "G-ENQH0V79HB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getDatabase(app);
const messaging = getMessaging(app);

export const saveTokenToDatabase = (userId, token) => {
  const tokenRef = ref(db, `users/${userId}/fcmToken`);
  return set(tokenRef, token);
};

export const requestPermission = async (userId) => {
  try {
    await Notification.requestPermission();
    const vapidKey = 'BF7Y-jDYwrv-D7JMNVP2lR7axefh10Pc5lzVcmm1y6Gas_1jRLwNpNN2yAbMHSxRz22hoN9cEZQAKhKkJ0G9zfA';
    console.log("Using VAPID key:", vapidKey);  // Verify the key format here
    const token = await getToken(messaging, { vapidKey });
    if (token) {
      console.log("FCM Token:", token);
      await saveTokenToDatabase(userId, token); // Save token with user ID in the database
    }
  } catch (error) {
    console.error("Error getting notification permission or FCM token:", error);
  }
};


export const onMessageListener = () => new Promise((resolve) => {
  onMessage(messaging, (payload) => resolve(payload));
});

export { auth };


 
