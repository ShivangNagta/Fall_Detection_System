// Contacts.jsx
import { useState } from "react";
import { db } from "./firebase"; // Import db from firebase.js
import { collection, addDoc } from "firebase/firestore"; // Firestore functions for adding data

export default function Contacts() {
  const [contacts, setContacts] = useState([{ name: "", phone: "" }]);

  // Function to add a new contact input field
  const addContact = () => {
    setContacts([...contacts, { name: "", phone: "" }]);
  };

  // Function to handle form input changes
  const handleInputChange = (index, field, value) => {
    const updatedContacts = [...contacts];
    updatedContacts[index][field] = value;
    setContacts(updatedContacts);
  };

  // Function to save contacts to Firestore
  const saveContacts = async () => {
    try {
      const contactsCollection = collection(db, "contacts"); // Collection name
      for (let contact of contacts) {
        // Only save if the contact has a name and phone number
        if (contact.name && contact.phone) {
          await addDoc(contactsCollection, contact);
        }
      }
      alert("Contacts saved successfully!");
    } catch (error) {
      console.error("Error adding contacts: ", error);
    }
  };

  return (
    <div className="bg-white p-4 shadow-md rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Emergency Contacts</h2>
      {contacts.map((contact, index) => (
        <div key={index} className="flex mb-2 space-x-2">
          <input
            type="text"
            placeholder="Name"
            value={contact.name}
            onChange={(e) => handleInputChange(index, "name", e.target.value)}
            className="p-2 border rounded w-1/2"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={contact.phone}
            onChange={(e) => handleInputChange(index, "phone", e.target.value)}
            className="p-2 border rounded w-1/2"
          />
        </div>
      ))}
      <button onClick={addContact} className="mt-2 bg-blue-500 text-white p-2 rounded">
        Add Contact
      </button>
      <button onClick={saveContacts} className="mt-2 bg-green-500 text-white p-2 rounded">
        Save Contacts
      </button>
    </div>
  );
}
