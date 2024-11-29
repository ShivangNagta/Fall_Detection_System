#include <Wire.h>
#include <MPU6050.h>
#include <math.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#define BUZZER_PIN 15

const char* ssid = "xyz";
const char* password = "xyz";
const char* token = "OejnIhc9uHhofTwcosATc5k4lg12";
const char* serverName = "https://falldetectionserver-vxoj.onrender.com/fallDetection"; 

MPU6050 mpu;

const int motionThreshold = 50000;
const int smallMotionThreshold = 40000;
const int stillnessDuration = 2500;
const int gyroThreshold = 70000;  // Threshold for gyroscope angular acceleration
const int smallGyroThreshold = 50000;


int16_t prevAx = 0, prevAy = 0, prevAz = 0;
int16_t prevGx = 0, prevGy = 0, prevGz = 0;

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  Wire.begin();

  mpu.initialize();
  if (!mpu.testConnection()) {
    Serial.println("MPU6050 connection failed");
    while (1);
  }
  Serial.println("MPU6050 connected successfully");

  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
}

void loop() {
  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  double totalAccelChange = calculateChange(ax, ay, az, prevAx, prevAy, prevAz);
  double totalGyroChange = calculateChange(gx, gy, gz, prevGx, prevGy, prevGz);
  
  Serial.println("Accel Change: " + String(totalAccelChange));
  Serial.println("Gyro Change: " + String(totalGyroChange));

  detectMotion(totalAccelChange, totalGyroChange);
  Serial.println();

  prevAx = ax;
  prevAy = ay;
  prevAz = az;
  prevGx = gx;
  prevGy = gy;
  prevGz = gz;

  delay(100);
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
    delay(1000);
    checkFallState();
  }
}

void checkFallState() {
  Serial.println("Monitoring for movement...");
  delay(1500);
  unsigned long startTime = millis();
  long gyroMagnitude;
  long accelMagnitude;
  while (millis() - startTime < stillnessDuration) {
    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

    accelMagnitude = calculateChange(ax, ay, az, prevAx, prevAy, prevAz);
    gyroMagnitude = calculateChange(gx, gy, gz, prevGx, prevGy, prevGz);

    
    }
    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
    accelMagnitude = calculateChange(ax, ay, az, prevAx, prevAy, prevAz);
    gyroMagnitude = calculateChange(gx, gy, gz, prevGx, prevGy, prevGz);
    if (accelMagnitude > smallMotionThreshold || gyroMagnitude > smallGyroThreshold) {
      Serial.println("Movement detected during monitoring period.");
      Serial.print("\tAccel Change: " + String(accelMagnitude));
      Serial.print("\tGyro Change: " + String(gyroMagnitude));

      return;
    delay(100);
  }
  Serial.println("Fall detected!");
  digitalWrite(BUZZER_PIN, HIGH);
  delay(9000);
  sendRequest();
  digitalWrite(BUZZER_PIN, LOW);
}

void sendRequest() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;  
    HTTPClient http;

    client.setInsecure();  

    http.begin(client, serverName);
    http.addHeader("Content-Type", "application/json");

    String jsonData = "{\"userId\": \"" + String(token) + "\"}";
    int httpResponseCode = http.POST(jsonData);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Server response: " + response);
    } else {
      Serial.println("Error in HTTP request");
    }
    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }
}
