const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const axios = require('axios');
require("dotenv").config();

const port = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.PROJECT_ID,
    privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.CLIENT_EMAIL,
  }),
  databaseURL: `https://${process.env.PROJECT_ID}-default-rtdb.firebaseio.com`,
});

const db = admin.firestore();
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);



// Route to receive data from ESP32
app.post("/processFallData", async (req, res) => {
  const { userId, data } = req.body;

  // Validate that userId and data are present
  if (!userId || !data || !Array.isArray(data) || data.length !== 200 || data.some(item => item.length !== 6)) {
    return res.status(400).send("Invalid data format. Must be a 200-size array with 6 elements each.");
  }

  try {
    const response = await axios.post('http://127.0.0.1:5000/predict', { data });

    const fallDetected = response.data.fallDetected;

    if (fallDetected) {
      console.log(`Fall detected for user ${userId}`);
      await handleFallDetection(userId);
      res.status(200).send("Fall detected and notifications sent.");
    } else {
      res.status(200).send("No fall detected.");
    }
  } catch (error) {
    console.error("Error calling Python API:", error);
    res.status(500).send("Internal server error");
  }
});

async function handleFallDetection(userId) {
  try {
    const userRef = admin.database().ref(`/users/${userId}`);
    const userSnapshot = await userRef.once("value");

    if (!userSnapshot.exists()) {
      return { status: 404, message: "User not found" };
    }

    const userData = userSnapshot.val();
    const { username } = userData;

    if (!username) {
      return { status: 400, message: "Username not found for the user" };
    }

    const fallEvent = {
      message: `A fall has been detected for ${username}. Please check on them.`,
      timestamp: Date.now(),
      username,
    };

    const fallEventForUser = {
      message: "A fall has been detected for you.",
      timestamp: Date.now(),
      username,
    }

    const fallEventRef = admin.database().ref(`/fallEvents/${userId}`);
    await fallEventRef.set(fallEventForUser);

    const userHistoryRef = admin.database().ref(`/fallHistory/${userId}`);
    await userHistoryRef.push(fallEventForUser);

    const contactsRef = admin.database().ref(`/contacts/${userId}`);
    const contactsSnapshot = await contactsRef.once("value");

    if (!contactsSnapshot.exists()) {
      return { status: 404, message: "No contacts found for this user" };
    }

    const contacts = contactsSnapshot.val();
    const notificationPromises = [];

    for (const contactId of Object.keys(contacts)) {
      const contactRef = admin.database().ref(`/users/${contactId}`);
      const contactSnapshot = await contactRef.once("value");

      if (!contactSnapshot.exists()) continue;

      const contactData = contactSnapshot.val();
      const { notificationSettings } = contactData;

      if (!notificationSettings) continue;

      const { inAppNotification, smsNotification, phoneNumber } = notificationSettings;

      const contactHistoryRef = admin.database().ref(`/fallHistory/${contactId}`);
      notificationPromises.push(contactHistoryRef.push(fallEvent));

      if (inAppNotification) {
        const contactFallEventRef = admin.database().ref(`/fallEvents/${contactId}`);
        notificationPromises.push(
          contactFallEventRef.set({
            message: `A fall has been detected for your contact (${username}).`,
            timestamp: Date.now(),
          })
        );
      }

      if (smsNotification && phoneNumber) {
        notificationPromises.push(
          twilioClient.messages.create({
            body: `A fall has been detected for your contact ${username}. Please check on them.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber,
          })
        );
      }
    }

    await Promise.all(notificationPromises);

  } catch (error) {
    console.error("Error handling fall detection:", error);
    throw new Error("Error handling fall detection");
  }
}

app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({
    error: "An unexpected error occurred",
    message: error.message,
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
