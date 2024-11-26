import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { ref, onValue, remove } from 'firebase/database';
import Header from './components/Header';
import AuthForm from './components/AuthForm';
import Contacts from './components/Contacts';
import PendingRequests from './components/PendingRequests';
import NotificationSettings from './components/NotificationSettings';
import SendRequest from './components/SendRequest';
import FallNotification from './components/FallNotification';
import FallHistory from './components/FallHistory';

const App = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [fallEvent, setFallEvent] = useState(null);
  const [fallHistory, setFallHistory] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  // Fetch Pending Requests
  useEffect(() => {
    if (user) {
      const requestsRef = ref(db, `requests/${user.uid}`);
      const unsubscribe = onValue(requestsRef, (snapshot) => {
        const data = snapshot.val();
        setRequests(data ? Object.entries(data).map(([id, value]) => ({ id, ...value })) : []);
      });

      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const historyRef = ref(db, `fallHistory/${user.uid}`);
      const unsubscribe = onValue(historyRef, (snapshot) => {
        const data = snapshot.val();
        setFallHistory(data ? Object.values(data) : []);
      });

      return () => unsubscribe();
    }
  }, [user]);

  // Fetch Contacts
  useEffect(() => {
    if (user) {
      const contactsRef = ref(db, `contacts/${user.uid}`);
      const unsubscribe = onValue(contactsRef, (snapshot) => {
        const data = snapshot.val();
        setContacts(data ? Object.entries(data).map(([id, value]) => ({ id, ...value })) : []);
      });

      return () => unsubscribe();
    }
  }, [user]);

  // Fetch Notification History
  useEffect(() => {
    if (user) {
      const notificationsRef = ref(db, `notifications/${user.uid}`);
      const unsubscribe = onValue(notificationsRef, (snapshot) => {
        const data = snapshot.val();
        setNotifications(data ? Object.values(data) : []);
      });

      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const fallEventRef = ref(db, `fallEvents/${user.uid}`);
      const unsubscribe = onValue(fallEventRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setFallEvent(data);
          // Auto-remove the fall event after displaying
          setTimeout(() => remove(fallEventRef), 30000);
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-zinc-950 text-gray-100">
      <Header user={user} />
      <main className="container mx-auto px-6 py-16 space-y-8">
        {error && (
          <div className="bg-red-700 border border-red-600 text-red-100 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!user ? (
          <AuthForm setError={setError} />
        ) : (
          <div className="space-y-8">

            {fallEvent && (
              <FallNotification
                message={fallEvent.message}
                onClose={() => setFallEvent(null)}
              />
            )}

            <section className="bg-zinc-900 rounded-lg shadow-xl p-6 mt-12">
              <Contacts user={user} contacts={contacts} />
            </section>

            <section className="bg-zinc-900 rounded-lg shadow-xl p-6">
              <SendRequest user={user} />
            </section>


            <section className="bg-zinc-900 rounded-lg shadow-xl p-6">
              <PendingRequests
                user={user}
                requests={requests}
                setRequests={setRequests}
              />
            </section>

            <section className="bg-zinc-900 rounded-lg shadow-xl p-6">
              <FallHistory history={fallHistory} />
            </section>
            
            <section className="bg-zinc-900 rounded-lg shadow-xl p-6">
              <NotificationSettings user={user} />
            </section>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;
