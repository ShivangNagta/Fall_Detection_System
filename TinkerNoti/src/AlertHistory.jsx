// AlertHistory.jsx
import { useEffect, useState } from "react";
import { db } from "./firebase"; // Import db from firebase.js
import { collection, onSnapshot } from "firebase/firestore";

export default function AlertHistory() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const alertsRef = collection(db, "alerts");
    const unsubscribe = onSnapshot(alertsRef, (snapshot) => {
      setAlerts(snapshot.docs.map((doc) => doc.data()));
    });

    return unsubscribe;
  }, []);

  return (
    <div className="bg-white p-4 shadow-md rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Alert History</h2>
      <ul>
        {alerts.map((alert, index) => (
          <li key={index} className="mb-2">
            {alert.timestamp}: Fall detected at {alert.location || "unknown location"}
          </li>
        ))}
      </ul>
    </div>
  );
}
