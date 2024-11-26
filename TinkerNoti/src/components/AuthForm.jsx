import React, { useState } from 'react';
import {
  auth,
  db,
  googleProvider
} from '../firebase';
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { getMessaging, getToken } from 'firebase/messaging';
import { ref, set, get } from "firebase/database";
import { requestPermission } from "../firebase";
import { ArrowRight, Mail, Lock, User, AlertCircle } from 'lucide-react';

const AuthForm = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const messaging = getMessaging();

  // Save user data with FCM token
  const saveUserData = async (userID, userData) => {
    try {
      const userRef = ref(db, `users/${userID}`);
      await set(userRef, {
        ...userData,
        notificationSettings: {
          inAppNotification: false,
          smsNotification: false,
        },
        connections: [],
        createdAt: new Date().toISOString(),
      });
      console.log("User data saved successfully");
    } catch (error) {
      console.error("Error saving user data:", error);
      throw error;
    }
  };

  const getFCMToken = async () => {
    try {
      const token = await getToken(messaging, { vapidKey: 'BF7Y-jDYwrv-D7JMNVP2lR7axefh10Pc5lzVcmm1y6Gas_1jRLwNpNN2yAbMHSxRz22hoN9cEZQAKhKkJ0G9zfA' });
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await getFCMToken();

      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        await set(userRef, {
          username: user.displayName,
          email: user.email,
          provider: 'google',
          fcmToken: token,
          notificationSettings: {
            inAppNotification: false,
            smsNotification: false,
          },
          connections: [],
          createdAt: new Date().toISOString(),
        });
      }
      await requestPermission(user.uid);
    } catch (error) {
      console.error('Google Sign-in Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const token = await getFCMToken();
        await saveUserData(user.uid, {
          username,
          email,
          provider: 'email',
          fcmToken: token,
        });
        await updateProfile(userCredential.user, {
          displayName: username,
        });

        console.log('Registration successful');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful');
      }
    } catch (error) {
      console.error('Auth Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col gap-10 items-center justify-center bg-zinc-900 text-gray-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <img
          src="../../fall.png"
          alt="Accident Icon"
          className="w-64 h-64 mx-auto" 
        />
      </div>

      <div className="max-w-md w-full space-y-8 bg-zinc-800 rounded-lg shadow-lg p-6">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-100">
            {isRegistering ? 'Create Your Account' : 'Sign In'}
          </h2>
        </div>

        {error && (
          <div className="flex items-center p-4 bg-red-600 bg-opacity-25 border border-red-600 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-sm text-gray-100">{error}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4">
            {isRegistering && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  className="bg-zinc-700 text-gray-200 placeholder-gray-500 border-zinc-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg block w-full pl-10 py-2"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                required
                className="bg-zinc-700 text-gray-200 placeholder-gray-500 border-zinc-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg block w-full pl-10 py-2"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                required
                className="bg-zinc-700 text-gray-200 placeholder-gray-500 border-zinc-600 focus:ring-blue-500 focus:border-blue-500 rounded-lg block w-full pl-10 py-2"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
            >
              {isRegistering ? 'Register' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 text-gray-200 py-2 rounded-lg disabled:opacity-50"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google logo"
                className="h-5 w-5 mr-2"
              />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-blue-400 hover:underline"
            >
              {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
