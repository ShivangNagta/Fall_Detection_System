const express = require("express");
const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();

// Initialize Firebase Admin SDK
const serviceAccount = require("./tinkeringfalldetection-firebase.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(express.json());

// Endpoint to receive fall detection data from ESP32
app.post("/fall-detection", async (req, res) => {
  const { detected, userTokens } = req.body;

  if (detected) {
    const message = {
      notification: {
        title: "Fall Detected!",
        body: "A fall has been detected. Please check on the person immediately.",
      },
      tokens: userTokens,  // Array of device tokens
    };

    try {
      await admin.messaging().sendMulticast(message);
      res.status(200).send("Notification sent successfully!");
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).send("Failed to send notification");
    }
  } else {
    res.status(400).send("No fall detected");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
