# Fall Detection System

A IoT-based fall detection system using ESP32 microcontroller and accelerometer sensor with real-time notifications and web application integration.

## Overview

This project implements an intelligent fall detection system designed to monitor sudden falls and alert emergency contacts or caregivers. The system combines hardware sensors with software applications to provide a complete safety monitoring solution, particularly useful for elderly care, healthcare facilities, and personal safety applications.

## Features

- **Real-time Fall Detection**: Uses accelerometer and gyroscope data to detect sudden falls
- **Instant Notifications**: Sends immediate alerts when a fall is detected with twilio 
- **Mobile Application**: Companion app for users
- **Data Logging**: Historical data tracking

## Hardware Components

### Required Components
- **ESP32 Development Board** - Main microcontroller
- **MPU6050** - 6-axis accelerometer and gyroscope sensor
- **Buzzer** - Audio alert system
- **Push Button** - Manual override/reset button

## Software Architecture

### ESP32 Firmware
- **Sensor Data Processing**: Real-time accelerometer and gyroscope analysis
- **Fall Detection Algorithm**: Threshold-based detection using acceleration magnitude
- **Notification System**: HTTP requests

### Web Application
- **Alert Management**: Notification handling and emergency contacts
- **History Tracking**: Fall incident logs and analytics
- **User Interface**: Intuitive dashboard and controls

## Installation & Setup

Not added


##  Fall Detection Algorithm

The system uses a multi-parameter approach for accurate fall detection:

### Detection Parameters
- **Acceleration Magnitude**: Sudden changes in total acceleration
- **Angular Velocity**: Rapid rotation detection
- **Orientation Change**: Device tilt and position analysis
