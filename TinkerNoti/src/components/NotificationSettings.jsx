import React, { useState, useEffect } from "react";
import { ref, get, update } from "firebase/database";
import { db } from "../firebase";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const NotificationSettings = ({ user }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [inAppNotification, setInAppNotification] = useState(false);
  const [smsNotification, setSmsNotification] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [settingsSaved, setSettingsSaved] = useState(false);


  useEffect(() => {
    if (!user) return; 

    const settingsRef = ref(db, `users/${user.uid}/notificationSettings`);
    get(settingsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const settings = snapshot.val();
        setInAppNotification(settings.inAppNotification || false);
        setSmsNotification(settings.smsNotification || false);
        setPhoneNumber(settings.phoneNumber || "");
        setCountryCode(settings.phoneNumber?.slice(0, 3) || "+91");
      }
    });
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user) {
      console.error("User is not authenticated.");
      return;
    }

    if (smsNotification && (!phoneNumber || phoneNumber.length !== 10)) {
      console.error("Invalid phone number. Please enter a valid 10-digit number.");
      return;
    }

    const formattedPhoneNumber = `${countryCode}${phoneNumber}`;
    const userRef = ref(db, `users/${user.uid}/notificationSettings`);

    const notificationSettings = {
      inAppNotification,
      smsNotification,
      phoneNumber: smsNotification ? formattedPhoneNumber : "",
    };

    await update(userRef, notificationSettings);
    console.log("Notification settings saved:", notificationSettings);

    setSettingsSaved(true); 
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="p-6 bg-zinc-800 rounded-lg shadow-lg max-w-lg mx-auto">
      <h2 className="text-lg font-semibold text-gray-100 mb-4">Notification Settings</h2>

      <div className="space-y-4">
        {/* In-App Notification Toggle */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="inAppNotification"
            checked={inAppNotification}
            onChange={(e) => setInAppNotification(e.target.checked)}
            className="w-5 h-5 text-blue-600 bg-zinc-700 border-zinc-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label
            htmlFor="inAppNotification"
            className="text-gray-100 font-medium"
          >
            Enable In-App Notifications
          </label>
        </div>

        {/* SMS Notification Toggle */}
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="smsNotification"
              checked={smsNotification}
              onChange={(e) => setSmsNotification(e.target.checked)}
              className="w-5 h-5 text-blue-600 bg-zinc-700 border-zinc-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label
              htmlFor="smsNotification"
              className="text-gray-100 font-medium"
            >
              Enable SMS Notifications
            </label>
          </div>

          {smsNotification && (
            <div className="flex items-center space-x-4 mt-4">
              <PhoneInput
                country="in"
                onlyCountries={["in", "us", "gb", "ca", "au"]}
                value={countryCode.slice(1)} // Remove '+' from country code for display
                onChange={(code) => setCountryCode(`+${code}`)}
                inputStyle={{
                  display: "none", // Hide input box for the dropdown
                }}
                buttonStyle={{
                  border: "1px solid #4B5563", 
                  borderRadius: "5px",
                  backgroundColor: "#080808", 
                  color: "#ffffff", 
                  padding: "1rem 1rem",
                  margin: "0rem 0rem"
                }}
                dropdownStyle={{
                  borderRadius: "5px",
                  backgroundColor: "#080808", 
                  color: "#F9FAFB", 
                }}
              />

              <input
                type="tel"
                id="phoneNumber"
                size="15"
                className="flex-1 px-4 py-2 mt-8 border-2 border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-700 text-gray-100"
                placeholder="Enter 10 digits"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={10}
              />
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveSettings}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Settings
        </button>

        {/* Confirmation Message */}
        {settingsSaved && (
          <div className="mt-4 text-green-500 font-medium">
            Settings saved successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
