# HC-SR04 Ultrasonic Distance Sensor Troubleshooting

## Summary
The HC-SR04 ultrasonic sensor uses 40kHz acoustic pulses to measure distance. It operates on 5V VCC and provides a Trigger input (needs a 10us HIGH pulse) and an Echo output (returns HIGH pulse duration proportional to distance).

## Common Problems & Symptoms
- **Sensor always returns 0 cm or 0 us duration**: The Echo pin never goes HIGH or Trigger pulse is not received.
- **Sensor returns constant 1157 cm or maximum value**: Echo pin is stuck HIGH because no echo pulse bounced back or surface was angled >15 degrees.
- **3.3V Microcontroller (ESP32 / Raspberry Pi Pico) Issues**: The HC-SR04 Echo output is 5V, which can damage 3.3V GPIOs or trigger logic threshold failures.

## Remediation Steps
1. Verify VCC is connected to a true 5V pin (HC-SR04 requires >= 4.5V to operate reliably; 3.3V will fail).
2. On 3.3V boards, install a voltage divider (1k ohm and 2k ohm resistors) on the Echo pin before connecting to GPIO.
3. Check code for `pulseIn(echoPin, HIGH)` timeout settings. Add a 30,000 us (30ms) timeout to prevent infinite blocking.
4. Ensure target object is sound-reflective, flat, and within 2cm to 400cm range.
