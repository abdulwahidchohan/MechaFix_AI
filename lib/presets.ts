export interface PresetConfig {
  id: string;
  label: string;
  icon: string;
  board?: string;
  component?: string;
  problemCategory: string;
  actualBehaviorSuggestion: string;
}

export const PRESETS: PresetConfig[] = [
  {
    id: "hcsr04",
    label: "HC-SR04 returns zero",
    icon: "sensors",
    board: "Arduino Uno",
    component: "HC-SR04 Ultrasonic Sensor",
    problemCategory: "Sensor Communication Failure",
    actualBehaviorSuggestion: "HC-SR04 ultrasonic sensor always returns 0 cm distance or pulseIn times out.",
  },
  {
    id: "servo",
    label: "Servo motor jittering",
    icon: "cyclone",
    board: "Arduino Nano",
    component: "SG90 Servo Motor",
    problemCategory: "Actuator / Servo Instability",
    actualBehaviorSuggestion: "SG90 servo motor buzzes continuously and jitters erratically when commanded to hold position.",
  },
  {
    id: "motor_reset",
    label: "Arduino resets on motor start",
    icon: "restart_alt",
    board: "Arduino Uno R3",
    component: "L298N DC Motor Driver",
    problemCategory: "Power Instability / Brownout",
    actualBehaviorSuggestion: "Arduino restarts immediately whenever the DC motor is triggered or direction is changed.",
  },
  {
    id: "i2c_scan",
    label: "I2C device not found",
    icon: "cable",
    board: "ESP32 DevKit V1",
    component: "16x2 I2C LCD Display",
    problemCategory: "Serial / I2C / SPI Failure",
    actualBehaviorSuggestion: "I2C scanner sketch reports 'No I2C devices found' and LCD backlight remains blank.",
  },
  {
    id: "power",
    label: "Board not powering",
    icon: "electric_bolt",
    board: "ESP32 DevKit V1",
    component: "Onboard Power Regulator",
    problemCategory: "Board Power Issue",
    actualBehaviorSuggestion: "No LEDs illuminate when plugged in, board remains completely unresponsive.",
  },
];
