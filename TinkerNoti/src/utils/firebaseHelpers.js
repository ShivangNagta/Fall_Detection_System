import { ref, get, push, update } from 'firebase/database';
import { db } from '../firebase';

export const fetchUserByID = async (userID) => {
  const snapshot = await get(ref(db, `users/${userID}`));
  return snapshot.val();
};

export const sendNotification = async (userID, message) => {
  const notificationsRef = ref(db, `history/${userID}`);
  await push(notificationsRef, {
    message,
    timestamp: new Date().toISOString(),
  });
};

export const updateUserConnections = async (userID, connections) => {
  const userRef = ref(db, `users/${userID}`);
  await update(userRef, { connections });
};
