import React from "react";
import { ref, remove, set } from "firebase/database";
import { db } from "../firebase"; // Adjust the path if necessary

const PendingRequests = ({ user, requests, setRequests }) => {
  const handleAccept = async (requestId) => {
    try {
    
      const requestRef = ref(db, `requests/${user.uid}/${requestId}`);
      await remove(requestRef);

      const contactRef = ref(db, `contacts/${user.uid}/${requestId}`);
      const contactReverseRef = ref(db, `contacts/${requestId}/${user.uid}`)

      await set(contactRef, { status: "accepted" });
      await set(contactReverseRef, { status: "accepted" });

      setRequests((prev) => prev.filter((request) => request.id !== requestId));
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleReject = async (requestId) => {
    try {
    
      const requestRef = ref(db, `requests/${user.uid}/${requestId}`);
      await remove(requestRef);
      setRequests((prev) => prev.filter((request) => request.id !== requestId));
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  return (
    <div className="p-6 bg-zinc-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Pending Friend Requests</h2>
      {requests.length === 0 ? (
        <p className="text-gray-400">No pending requests.</p>
      ) : (
        <ul className="space-y-4">
          {requests.map((request) => (
            <li
              key={request.id}
              className="flex justify-between items-center bg-zinc-700 p-4 rounded-lg shadow-md"
            >
              <span className="text-gray-100">{request.senderUsername || "Anonymous User"}</span>
              <div className="space-x-2">
                <button
                  onClick={() => handleAccept(request.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PendingRequests;
