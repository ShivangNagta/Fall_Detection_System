import { sendInvitation } from './firebase';  // Import your sendInvitation function

const sendContactInvitation = async (senderId, recipientId, sendSms) => {
  try {
    await sendInvitation(senderId, recipientId, sendSms);
    alert('Invitation sent successfully');
  } catch (error) {
    console.error(error.message);
    alert('Failed to send invitation');
  }
};
