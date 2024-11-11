const admin = require("firebase-admin");
const functions = require("firebase-functions");

// Initialize Firebase Admin SDK with the service account
const serviceAccount = require("./tinkering24-88f4d-firebase-adminsdk-tf8a5-33716c6887.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tinkeringfalldetection-default-rtdb.firebaseio.com/",
});

// Function triggers when `fallDetected` field changes
exports.notifyFallDetected = functions.firestore
  .document("fallEvents/{userId}")
  .onUpdate(async (change, context) => {
    const { userId } = context.params;
    const newValue = change.after.data();

    // Check if fallDetected is true
    if (newValue.fallDetected) {
      try {
        // Retrieve user's FCM token from Firestore
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) {
          console.log("User not found");
          return null;
        }

        const userData = userDoc.data();
        const fcmToken = userData.fcmToken;

        // Construct the notification message
        const message = {
          token: fcmToken,
          notification: {
            title: "Fall Detected",
            body: "A fall has been detected. Please check on the user.",
          },
        };

        // Send notification via Firebase Cloud Messaging
        await admin.messaging().send(message);
        console.log("Notification sent to user:", userId);
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    }

    return null;
  });
