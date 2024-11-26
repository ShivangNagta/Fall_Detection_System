import React, { useState } from "react";
import { ref, query, orderByChild, get, set } from "firebase/database";
import { db } from "../firebase";

const SendRequest = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [sentRequests, setSentRequests] = useState([]); // Track sent requests
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Please enter a username to search.");
      return;
    }

    try {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const usersRef = ref(db, "users");
      const usersQuery = query(usersRef, orderByChild("username"));

      const snapshot = await get(usersQuery);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const matchingUsers = Object.entries(data)
          .map(([id, value]) => ({ id, ...value }))
          .filter(
            (userEntry) =>
              userEntry.id !== user.uid &&
              userEntry.username?.toLowerCase().includes(lowerCaseSearchTerm)
          );

        setResults(matchingUsers);
        setError(""); // Clear error on successful search
      } else {
        setResults([]);
        setError("No matching users found.");
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setError("Failed to search users. Please try again.");
    }
  };

  const sendRequest = async (receiverId) => {
    try {
      const requestRef = ref(db, `requests/${receiverId}/${user.uid}`);
      await set(requestRef, {
        sender: user.uid,
        senderUsername: user.displayName || "Anonymous",
        status: "pending",
        sentAt: new Date().toISOString(),
      });

      setSentRequests((prev) => [...prev, receiverId]);
      console.log("Request sent successfully!");
    } catch (error) {
      console.error("Error sending request:", error);
      setError("Failed to send request. Please try again.");
    }
  };

  return (
    <div className="p-6 bg-zinc-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Send Friend Request</h2>
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <input
          type="text"
          placeholder="Search username"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded-lg flex-grow bg-zinc-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-zinc-600"
          style={{ caretColor: "white" }}
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-zinc-700 text-gray-100 rounded-lg hover:bg-zinc-600 transition duration-300 w-full sm:w-auto"
        >
          Search
        </button>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}

      <ul className="mt-4 space-y-2">
        {results.map((userEntry) => (
          <li
            key={userEntry.id}
            className="flex justify-between items-center p-2 border rounded-lg bg-zinc-800 text-gray-100"
          >
            <span>{userEntry.username}</span>
            {sentRequests.includes(userEntry.id) ? (
              <button
                disabled
                className="px-4 py-2 bg-zinc-600 text-gray-300 rounded-lg"
              >
                Sent Successfully
              </button>
            ) : (
              <button
                onClick={() => sendRequest(userEntry.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300"
              >
                Send Request
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>

  );
};

export default SendRequest;
