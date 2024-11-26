import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

const Contacts = ({ user }) => {
  const [contacts, setContacts] = useState([]);
  const [contactDetails, setContactDetails] = useState({});

  // Fetch contact IDs
  useEffect(() => {
    if (user) {
      const contactsRef = ref(db, `contacts/${user.uid}`);
      const unsubscribe = onValue(
        contactsRef,
        (snapshot) => {
          const data = snapshot.val();
          console.log("Contacts data:", data);
          if (data) {
            setContacts(Object.keys(data));
          } else {
            setContacts([]);
          }
        },
        (error) => {
          console.error("Error fetching contacts:", error);
        }
      );

      return () => unsubscribe();
    }
  }, [user]);

  // Fetch contact details (username from users/{contactId})
  useEffect(() => {
    const fetchContactDetails = async () => {
      const details = {};
      for (const contactId of contacts) {
        const userRef = ref(db, `users/${contactId}`);
        await new Promise((resolve) => {
          onValue(
            userRef,
            (snapshot) => {
              const userData = snapshot.val();
              console.log(`Data for ${contactId}:`, userData);
              if (userData) {
                details[contactId] = userData.username || "Unknown User";
              } else {
                details[contactId] = "Unknown User";
              }
              resolve();
            },
            (error) => {
              console.error(`Error fetching user data for ${contactId}:`, error);
              details[contactId] = "Unknown User";
              resolve();
            },
            { onlyOnce: true }
          );
        });
      }
      setContactDetails(details);
    };

    if (contacts.length > 0) {
      fetchContactDetails();
    }
  }, [contacts]);

  return (
    <div className="p-6 bg-zinc-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Your Contacts</h2>
      {contacts.length === 0 ? (
        <p className="text-gray-400">You have no contacts yet.</p>
      ) : (
        <ul className="space-y-4">
          {contacts.map((contactId) => (
            <li
              key={contactId}
              className="flex items-center justify-between bg-zinc-700 rounded-lg px-4 py-2"
            >
              <span className="text-gray-100">{contactDetails[contactId] || "Loading..."}</span>
              <span className="text-sm text-gray-400">{contactId}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Contacts;
