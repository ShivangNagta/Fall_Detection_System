import React, { useState, useEffect } from 'react';
import { logOut } from '../auth';
import { sendInvitation, getUserInvitations, respondToInvitation } from '../invitations';

const HomeDashboard = ({ user }) => {
  const [recipientId, setRecipientId] = useState('');
  const [sendSms, setSendSms] = useState(false);
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    const unsubscribe = getUserInvitations(user.uid, (snapshot) => {
      const invites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvitations(invites);
    });
    return unsubscribe;
  }, [user.uid]);

  const handleSendInvitation = async () => {
    if (recipientId) {
      await sendInvitation(user.uid, recipientId, sendSms);
      alert('Invitation sent');
    }
  };

  const handleRespond = async (id, response) => {
    await respondToInvitation(id, response);
  };

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <button onClick={logOut}>Sign Out</button>

      <h2>Send Invitation</h2>
      <input type="text" placeholder="Recipient User ID" onChange={(e) => setRecipientId(e.target.value)} />
      <label>
        <input type="checkbox" checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} />
        Send SMS Notifications
      </label>
      <button onClick={handleSendInvitation}>Send</button>

      <h2>Invitations</h2>
      <ul>
        {invitations.map(invite => (
          <li key={invite.id}>
            {invite.senderId} sent an invitation. Status: {invite.status}
            <button onClick={() => handleRespond(invite.id, 'accepted')}>Accept</button>
            <button onClick={() => handleRespond(invite.id, 'declined')}>Decline</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HomeDashboard;
