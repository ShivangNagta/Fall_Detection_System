import { db } from "./firebase";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where } from "firebase/firestore";

// Send an invitation
export const sendInvitation = async (senderId, recipientId, sendSms) => {
  const invitation = {
    senderId,
    recipientId,
    status: "pending",
    sendSms,
    createdAt: new Date()
  };
  return addDoc(collection(db, "invitations"), invitation);
};

// Accept or decline an invitation
export const respondToInvitation = async (invitationId, response) => {
  const invitationRef = doc(db, "invitations", invitationId);
  return updateDoc(invitationRef, { status: response });
};

// Get user's invitations
export const getUserInvitations = (userId, callback) => {
  const q = query(collection(db, "invitations"), where("recipientId", "==", userId));
  return onSnapshot(q, callback);
};
