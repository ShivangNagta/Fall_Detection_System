import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Header = ({ user }) => {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-zinc-900 text-gray-100 fixed top-0 left-0 right-0 z-50 shadow-xl">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">Fall / Accident Alert System</h1>
          <h2 className="text-sm font-semibold text-zinc-400">Group-2</h2>
        </div>
        
        {user && (
          <button
            onClick={handleSignOut}
            className="bg-zinc-700 hover:bg-zinc-600 text-gray-100 font-semibold py-2 px-4 rounded-lg transition-all"
          >
            Sign Out
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
