#include <WiFi.h>
#include <FirebaseESP32.h>
#include <MPU6050.h> // Use the library that supports MPU6050

// Firebase setup
#define FIREBASE_HOST "your-project-id.firebaseio.com"
#define FIREBASE_AUTH "your-firebase-database-secret"

// WiFi credentials
const char* ssid = "your-SSID";
const char* password = "your-PASSWORD";

FirebaseData firebaseData;
MPU6050 mpu;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);

  mpu.initialize();
}

void loop() {
  if (fallDetected()) {
    sendFallAlert();
  }
  delay(1000);
}

bool fallDetected() {
  // Add your MPU6050 fall detection logic here
  // Return true if a fall is detected
}

void sendFallAlert() {
  String path = "/fallAlerts/" + String(millis());
  Firebase.setString(firebaseData, path, "Fall detected at " + String(millis()));
}
