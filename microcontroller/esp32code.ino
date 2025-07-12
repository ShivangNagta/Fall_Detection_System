#include <Wire.h>
#include <MPU6050.h>
#include <math.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "config.h"

MPU6050 mpu;

int16_t prevAx = 0, prevAy = 0, prevAz = 0;
int16_t prevGx = 0, prevGy = 0, prevGz = 0;

bool fallDetected = false;
bool systemInitialized = false;

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  
  Wire.begin();
  
  Serial.println("Initializing MPU6050...");
  mpu.initialize();
  
  if (!mpu.testConnection()) {
    Serial.println("MPU6050 connection failed");
    blinkError();
    while (1);
  }
  Serial.println("MPU6050 connected successfully");
  
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");
  
  unsigned long wifiTimeout = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < wifiTimeout) {
    delay(500);
    Serial.print(".");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnected to WiFi");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed - continuing without WiFi");
  }
  
  initializeBaseline();
  
  systemInitialized = true;
  digitalWrite(LED_PIN, HIGH);
  Serial.println("Fall detection system initialized");
}

void loop() {
  if (!systemInitialized) return;
  
  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  
  double totalAccelChange = calculateChange(ax, ay, az, prevAx, prevAy, prevAz);
  double totalGyroChange = calculateChange(gx, gy, gz, prevGx, prevGy, prevGz);
  
  Serial.println("Accel Change: " + String(totalAccelChange));
  Serial.println("Gyro Change: " + String(totalGyroChange));
  
  detectMotion(totalAccelChange, totalGyroChange);
  
  prevAx = ax;
  prevAy = ay;
  prevAz = az;
  prevGx = gx;
  prevGy = gy;
  prevGz = gz;
  
  Serial.println();
  delay(100);
}

void initializeBaseline() {
  Serial.println("Initializing baseline readings...");
  delay(1000);

  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  
  prevAx = ax;
  prevAy = ay;
  prevAz = az;
  prevGx = gx;
  prevGy = gy;
  prevGz = gz;
  
  Serial.println("Baseline initialized");
}

double calculateChange(int16_t currX, int16_t currY, int16_t currZ, int16_t prevX, int16_t prevY, int16_t prevZ) {
  long long deltaX = currX - prevX;
  long long deltaY = currY - prevY;
  long long deltaZ = currZ - prevZ;
  return sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
}

void detectMotion(double accelChange, double gyroChange) {
  if (accelChange > motionThreshold || gyroChange > gyroThreshold) {
    Serial.println("Sudden motion detected: Possible fall/accident!");
    delay(fallDetectionDelay);
    checkFallState();
  }
}

void checkFallState() {
  Serial.println("Monitoring for movement...");
  delay(monitoringDelay);
  
  unsigned long startTime = millis();
  bool movementDetected = false;
  
  while (millis() - startTime < stillnessDuration && !movementDetected) {
    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
    
    double accelMagnitude = calculateChange(ax, ay, az, prevAx, prevAy, prevAz);
    double gyroMagnitude = calculateChange(gx, gy, gz, prevGx, prevGy, prevGz);
    
    if (accelMagnitude > smallMotionThreshold || gyroMagnitude > smallGyroThreshold) {
      Serial.println("Movement detected during monitoring period.");
      Serial.println("\tAccel Change: " + String(accelMagnitude));
      Serial.println("\tGyro Change: " + String(gyroMagnitude));
      movementDetected = true;
      return;
    }

    prevAx = ax;
    prevAy = ay;
    prevAz = az;
    prevGx = gx;
    prevGy = gy;
    prevGz = gz;
    
    delay(100);
  }
  
  if (!movementDetected) {
    Serial.println("Fall detected!");
    triggerFallAlert();
  }
}

void triggerFallAlert() {
  fallDetected = true;

  digitalWrite(BUZZER_PIN, HIGH);

  for (int i = 0; i < 50; i++) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    delay(100);
  }

  sendRequest();

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, HIGH);
  
  fallDetected = false;
}

void sendRequest() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi Disconnected - attempting to reconnect...");
    WiFi.reconnect();
    delay(5000);
    
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi reconnection failed");
      return;
    }
  }
  
  WiFiClientSecure client;
  HTTPClient http;
  
  client.setInsecure();
  
  if (!http.begin(client, serverName)) {
    Serial.println("Failed to initialize HTTP client");
    return;
  }
  
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);
  
  String jsonData = "{\"userId\": \"" + String(token) + "\", \"timestamp\": \"" + String(millis()) + "\"}";
  
  Serial.println("Sending fall alert to server...");
  int httpResponseCode = http.POST(jsonData);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("HTTP Response Code: " + String(httpResponseCode));
    Serial.println("Server response: " + response);
  } else {
    Serial.println("Error in HTTP request. Code: " + String(httpResponseCode));
  }
  
  http.end();
}

void blinkError() {
  for (int i = 0; i < 10; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}
