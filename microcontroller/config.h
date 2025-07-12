#ifndef CONFIG_H
#define CONFIG_H

const char* ssid = "your-wifi-ssid";
const char* password = "your-wifi-password";

const char* token = "your-unique-token";
const char* serverName = "your-backend-route";

#define BUZZER_PIN 15
#define LED_PIN 2

const double motionThreshold = 50000.0;
const double smallMotionThreshold = 40000.0;
const unsigned long stillnessDuration = 2500;
const double gyroThreshold = 70000.0;
const double smallGyroThreshold = 50000.0;
const unsigned long fallDetectionDelay = 1000;
const unsigned long monitoringDelay = 1500;
const unsigned long buzzerDuration = 9000;

#endif