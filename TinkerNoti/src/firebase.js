import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
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

export { auth, googleProvider};


 
