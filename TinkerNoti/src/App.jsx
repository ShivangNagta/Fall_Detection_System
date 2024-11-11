import React, { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  ref, 
  set, 
  push,
  get,
  onValue, 
  remove, 
  update 
} from 'firebase/database';
import { auth, db } from '../firebase';
import { getMessaging, onMessage, getToken } from 'firebase/messaging';
import { Bell, UserPlus, LogOut, Check, X, Mail, MessageSquare } from 'lucide-react';

const App = () => {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [notificationPrefs, setNotificationPrefs] = useState({
    app: true,
    sms: false
  });

  useEffect(() => {
    // Check if the browser supports service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        // Load user data
        loadUserData(user.uid);
        // Listen for notifications
        listenForNotifications(user.uid);
        requestNotificationPermission(user); // Request permission on login
      } else {
        setUser(null);
        setContacts([]);
        setPendingRequests([]);
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Function to request notification permission and get FCM token
  const requestNotificationPermission = async (user) => {
    try {
      const messaging = getMessaging();
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: 'BF7Y-jDYwrv-D7JMNVP2lR7axefh10Pc5lzVcmm1y6Gas_1jRLwNpNN2yAbMHSxRz22hoN9cEZQAKhKkJ0G9zfA' });
        
        if (token) {
          // Store the token in the Firebase database or associate it with the user
          await update(ref(db, `users/${user.uid}/preferences`), { fcmToken: token });
        } else {
          console.warn('No FCM token received');
        }
      } else {
        console.warn('Notification permission denied');
      }
    } catch (error) {
      console.error('Error getting notification permission or FCM token:', error);
    }
  };

  // Function to handle incoming FCM messages while app is in the foreground
  useEffect(() => {
    const messaging = getMessaging();
    onMessage(messaging, (payload) => {
      console.log('Message received: ', payload);
      setNotifications((prevNotifications) => [
        ...prevNotifications,
        { message: payload.notification.body, type: 'alert', timestamp: Date.now() }
      ]);
    });
  }, []);

  const findUserByEmail = async (email) => {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    const users = snapshot.val();
    
    if (!users) return null;
    
    return Object.entries(users).find(([uid, userData]) => 
      userData.email === email
    );
  };

  const sendContactRequest = async () => {
    try {
      if (!searchEmail || searchEmail === user.email) {
        setError('Invalid email address');
        return;
      }

      // Find the recipient user
      const recipient = await findUserByEmail(searchEmail);
      if (!recipient) {
        setError('User not found');
        return;
      }

      const [recipientUid, recipientData] = recipient;

      // Check if request already exists
      const existingRequestsRef = ref(db, `users/${recipientUid}/pendingRequests`);
      const existingRequestsSnapshot = await get(existingRequestsRef);
      const existingRequests = existingRequestsSnapshot.val() || {};
      
      const alreadyRequested = Object.values(existingRequests)
        .some(request => request.email === user.email);

      if (alreadyRequested) {
        setError('Request already sent');
        return;
      }

      // Create the request
      const requestRef = push(ref(db, `users/${recipientUid}/pendingRequests`));
      await set(requestRef, {
        id: requestRef.key,
        email: user.email,
        senderUid: user.uid,
        status: 'pending',
        timestamp: Date.now()
      });

      // Add notification for recipient
      const notificationRef = push(ref(db, `notifications/${recipientUid}`));
      await set(notificationRef, {
        id: notificationRef.key,
        message: `New contact request from ${user.email}`,
        type: 'request',
        timestamp: Date.now()
      });

      setSearchEmail('');
    } catch (error) {
      console.error('Error sending request:', error);
      setError('Failed to send request');
    }
  };

  const acceptRequest = async (request) => {
    try {
      // Add to your contacts
      const yourContactRef = push(ref(db, `users/${user.uid}/contacts`));
      await set(yourContactRef, {
        id: yourContactRef.key,
        email: request.email,
        uid: request.senderUid,
        notificationPreferences: {
          app: true,
          sms: false
        }
      });

      // Add you to their contacts
      const theirContactRef = push(ref(db, `users/${request.senderUid}/contacts`));
      await set(theirContactRef, {
        id: theirContactRef.key,
        email: user.email,
        uid: user.uid,
        notificationPreferences: {
          app: true,
          sms: false
        }
      });

      // Remove the request
      await remove(ref(db, `users/${user.uid}/pendingRequests/${request.id}`));

      // Add notification for sender
      const notificationRef = push(ref(db, `notifications/${request.senderUid}`));
      await set(notificationRef, {
        id: notificationRef.key,
        message: `${user.email} accepted your contact request`,
        type: 'accepted',
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error accepting request:', error);
      setError('Failed to accept request');
    }
  };

  const loadUserData = (userId) => {
    // Load contacts
    onValue(ref(db, `users/${userId}/contacts`), (snapshot) => {
      const data = snapshot.val();
      setContacts(data ? Object.values(data) : []);
    });

    // Load pending requests
    onValue(ref(db, `users/${userId}/pendingRequests`), (snapshot) => {
      const data = snapshot.val();
      setPendingRequests(data ? Object.values(data) : []);
    });

    // Load notification preferences
    onValue(ref(db, `users/${userId}/preferences`), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setNotificationPrefs(data.notifications || { app: true, sms: false });
        setPhone(data.phone || '');
      }
    });
  };

  const listenForNotifications = (userId) => {
    onValue(ref(db, `notifications/${userId}`), (snapshot) => {
      const data = snapshot.val();
      setNotifications(data ? Object.values(data) : []);
    });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        // Register new user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Initialize user data
        await set(ref(db, `users/${userCredential.user.uid}`), {
          email,
          preferences: {
            notifications: {
              app: true,
              sms: false
            },
            phone: ''
          }
        });
      } else {
        // Login existing user
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error('Auth error:', error.code, error.message);
      setError(error.message);
    }
  };

  const logout = () => {
    signOut(auth);
  };



// Utility to format email
const formatEmailForFirebase = (email) => email.replace(/\./g, ',');


  
  

  const rejectRequest = async (request) => {
    try {
      await remove(ref(db, `users/${user.uid}/pendingRequests/${request.id}`));
    } catch (error) {
      setError('Failed to reject request');
    }
  };

  const updateNotificationPrefs = async (contactEmail, prefs) => {
    try {
      const contact = contacts.find(c => c.email === contactEmail);
      if (contact) {
        await update(ref(db, `users/${user.uid}/contacts/${contact.id}`), {
          notificationPreferences: prefs
        });
      }
    } catch (error) {
      setError('Failed to update notification preferences');
    }
  };

  const updatePhone = async (newPhone) => {
    try {
      await update(ref(db, `users/${user.uid}/preferences`), {
        phone: newPhone
      });
      setPhone(newPhone);
    } catch (error) {
      setError('Failed to update phone number');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {!user ? (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">
            {isRegistering ? 'Register' : 'Login'}
          </h2>
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </form>
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="mt-4 text-blue-500 hover:text-blue-600"
          >
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Fall Detection Alert System</h1>
            <button
              onClick={logout}
              className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>

          {/* User Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Notification Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="font-medium">Phone Number for SMS</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => updatePhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.app}
                    onChange={(e) => setNotificationPrefs({...notificationPrefs, app: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span>App Notifications</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.sms}
                    onChange={(e) => setNotificationPrefs({...notificationPrefs, sms: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span>SMS Notifications</span>
                </label>
              </div>
            </div>
          </div>

          {/* Add Contact Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Add Contact</h2>
            <div className="flex gap-2">
              <input
                placeholder="Enter email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendContactRequest}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Send Request
              </button>
            </div>
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Pending Requests</h2>
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div key={request.email} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span>{request.email}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest(request)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => rejectRequest(request)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contacts List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Contacts</h2>
            {contacts.length === 0 ? (
              <p className="text-gray-500">No contacts added yet</p>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div key={contact.email} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{contact.email}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={contact.notificationPreferences?.app}
                          onChange={(e) => updateNotificationPrefs(contact.email, {
                            ...contact.notificationPreferences,
                            app: e.target.checked
                          })}
                          className="rounded border-gray-300"
                        />
                        <Mail className="h-4 w-4" />
                        <span>App</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={contact.notificationPreferences?.sms}
                          onChange={(e) => updateNotificationPrefs(contact.email, {
                            ...contact.notificationPreferences,
                            sms: e.target.checked
                          })}
                          className="rounded border-gray-300"
                        />
                        <MessageSquare className="h-4 w-4" />
                        <span>SMS</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Recent Alerts</h2>
            {notifications.length === 0 ? (
              <p className="text-gray-500">No recent alerts</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification, index) => (
                  <div
                    key={index}
                    className="p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded-r-lg"
                  >
                    <p className="text-yellow-800">{notification.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;