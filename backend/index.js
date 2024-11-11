const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require('./tinkering24-88f4d-firebase-adminsdk-tf8a5-33716c6887.json')),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

const db = admin.firestore();
const app = express();
app.use(bodyParser.json());

// POST endpoint for fall detection
app.post('/fallDetection', async (req, res) => {
  const { userId } = req.body; // Assuming you send userId from ESP32

  try {
    // Get the FCM token for the user from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).send('User not found');
    }

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;
    console.log('usertoken',fcmToken);

    // Send notification if fall is detected
    const message = {
      token: fcmToken,
      notification: {
        title: 'Fall Detected',
        body: 'A fall has been detected. Please check on the user.',
      }
    };

    await admin.messaging().send(message);
    res.status(200).send('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Internal server error');
  }
});

app.listen(5137, () => {
  console.log('Backend server is running on port 5137');
});
