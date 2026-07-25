export interface PinDetail {
  pinName: string;
  type: "Power" | "GND" | "Digital" | "Analog" | "PWM" | "Communication" | "Interrupt" | "Special";
  description: string;
  voltageRating?: string;
  notes?: string;
}

export interface PinoutRecord {
  id: string;
  name: string;
  category: "microcontroller" | "sensor" | "actuator" | "display" | "driver";
  operatingVoltage: string;
  logicVoltage: string;
  maxCurrentPerPin?: string;
  officialSourceUrl: string;
  safetyWarnings: string[];
  pins: PinDetail[];
  description: string;
}

export const VERIFIED_PINOUTS: PinoutRecord[] = [
  {
    id: "arduino-uno",
    name: "Arduino UNO R3",
    category: "microcontroller",
    operatingVoltage: "5V DC (7-12V Input via Barrel Jack)",
    logicVoltage: "5V TTL",
    maxCurrentPerPin: "20 mA (40 mA Absolute Max)",
    officialSourceUrl: "https://docs.arduino.cc/hardware/uno-rev3",
    safetyWarnings: [
      "Never supply higher than 5.5V directly to the 5V pin.",
      "Total current drawn across all I/O pins must not exceed 200 mA.",
      "Do not power inductive motor loads directly from Arduino 5V pin without an external flyback diode and power supply.",
    ],
    description: "ATmega328P based microcontroller board with 14 digital I/O pins and 6 analog inputs.",
    pins: [
      { pinName: "5V", type: "Power", description: "Regulated 5V supply output when powered via USB/VIN.", voltageRating: "5.0V" },
      { pinName: "3V3", type: "Power", description: "Regulated 3.3V supply output from onboard regulator.", voltageRating: "3.3V (Max 50mA)" },
      { pinName: "GND", type: "GND", description: "Common ground reference pin." },
      { pinName: "VIN", type: "Power", description: "Input voltage when using an external 7-12V DC power source." },
      { pinName: "D0 (RX)", type: "Communication", description: "UART Receive pin. Disconnect during code upload." },
      { pinName: "D1 (TX)", type: "Communication", description: "UART Transmit pin. Disconnect during code upload." },
      { pinName: "D3, D5, D6, D9, D10, D11", type: "PWM", description: "8-bit PWM output pins (analogWrite)." },
      { pinName: "A0 - A5", type: "Analog", description: "10-bit Analog input pins (0 to 1023 ADC values)." },
      { pinName: "SDA (A4 / Dedicated)", type: "Communication", description: "I2C Serial Data Line." },
      { pinName: "SCL (A5 / Dedicated)", type: "Communication", description: "I2C Serial Clock Line." },
    ],
  },
  {
    id: "esp32-devkit",
    name: "ESP32 DevKit V1",
    category: "microcontroller",
    operatingVoltage: "3.3V DC (5V via Micro-USB / Vin)",
    logicVoltage: "3.3V strictly (NOT 5V tolerant!)",
    maxCurrentPerPin: "12 mA (40 mA Absolute Max)",
    officialSourceUrl: "https://docs.espressif.com/projects/esp-idf/en/latest/esp32/hw-reference/index.html",
    safetyWarnings: [
      "ESP32 GPIO pins are strictly 3.3V logic. Connecting 5V signals directly will permanently damage the chip!",
      "Use logic level converters when interfacing with 5V sensors or microcontrollers.",
      "GPIO 34, 35, 36, 39 are INPUT ONLY pins (no internal pull-up/pull-down).",
    ],
    description: "Dual-core Wi-Fi & Bluetooth microcontroller board operating at 240 MHz.",
    pins: [
      { pinName: "3V3", type: "Power", description: "3.3V regulated output.", voltageRating: "3.3V" },
      { pinName: "VIN / 5V", type: "Power", description: "5V input from USB or regulated external 5V." },
      { pinName: "GND", type: "GND", description: "Ground pin." },
      { pinName: "GPIO 21 (SDA)", type: "Communication", description: "Default I2C Data Line." },
      { pinName: "GPIO 22 (SCL)", type: "Communication", description: "Default I2C Clock Line." },
      { pinName: "GPIO 1 (TX0) / 3 (RX0)", type: "Communication", description: "UART0 Serial output/input." },
      { pinName: "GPIO 34 - 39", type: "Special", description: "Input-only GPIO pins (ADC1)." },
    ],
  },
  {
    id: "hc-sr04",
    name: "HC-SR04 Ultrasonic Distance Sensor",
    category: "sensor",
    operatingVoltage: "5V DC",
    logicVoltage: "5V TTL (Echo pin outputs 5V logic)",
    officialSourceUrl: "https://www.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf",
    safetyWarnings: [
      "Echo pin outputs 5V. When connecting to 3.3V boards (ESP32 / Raspberry Pi), use a voltage divider (1kΩ / 2kΩ resistors).",
    ],
    description: "Non-contact ultrasonic distance sensor measuring 2cm to 400cm.",
    pins: [
      { pinName: "VCC", type: "Power", description: "Connect to 5V DC supply.", voltageRating: "5.0V" },
      { pinName: "Trig", type: "Digital", description: "Trigger Input: Send 10µs HIGH pulse to start measurement." },
      { pinName: "Echo", type: "Digital", description: "Echo Output: HIGH pulse duration proportional to distance." },
      { pinName: "GND", type: "GND", description: "Ground reference." },
    ],
  },
  {
    id: "l298n-driver",
    name: "L298N Dual H-Bridge Motor Driver",
    category: "driver",
    operatingVoltage: "5V to 35V DC Motor Power (VMS)",
    logicVoltage: "5V TTL",
    officialSourceUrl: "https://www.sparkfun.com/datasheets/Robotics/L298_H_Bridge.pdf",
    safetyWarnings: [
      "Keep 5V jumper attached ONLY if VMS motor power is between 7V and 12V. Remove jumper if motor supply > 12V!",
      "Always connect motor power ground (GND) to microcontroller ground.",
    ],
    description: "Dual H-Bridge driver capable of driving two DC motors or one stepper motor.",
    pins: [
      { pinName: "VMS / 12V", type: "Power", description: "Motor power supply input (5V-35V)." },
      { pinName: "GND", type: "GND", description: "Common ground for motor supply & logic." },
      { pinName: "5V", type: "Power", description: "5V logic input or 5V output (if 5V onboard regulator jumper is enabled)." },
      { pinName: "ENA / ENB", type: "PWM", description: "Speed control PWM inputs (remove jumper to control speed)." },
      { pinName: "IN1, IN2 / IN3, IN4", type: "Digital", description: "Direction control inputs for Motor A and Motor B." },
    ],
  },
  {
    id: "dht11-sensor",
    name: "DHT11 Temperature & Humidity Sensor",
    category: "sensor",
    operatingVoltage: "3.3V to 5.5V DC",
    logicVoltage: "3.3V / 5V Single-Bus Serial",
    officialSourceUrl: "https://www.mouser.com/datasheet/2/758/DHT11-technical-data-sheet-translated-by-aosong-3165320.pdf",
    safetyWarnings: [
      "Requires a 4.7kΩ - 10kΩ pull-up resistor between VCC and Data pin for stable readings.",
    ],
    description: "Basic digital temperature and humidity sensor with single-wire digital interface.",
    pins: [
      { pinName: "VCC", type: "Power", description: "Power input (3.3V - 5V)." },
      { pinName: "DATA", type: "Digital", description: "Single-bus serial data output." },
      { pinName: "NC", type: "Special", description: "Not Connected pin." },
      { pinName: "GND", type: "GND", description: "Ground pin." },
    ],
  },
];
