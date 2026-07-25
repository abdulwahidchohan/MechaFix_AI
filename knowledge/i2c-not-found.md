# I2C Device Not Found / Communication Failure

## Summary
I2C (Inter-Integrated Circuit) uses two bidirectional lines: SDA (Serial Data) and SCL (Serial Clock). Every device on the I2C bus must have a unique 7-bit hex address (e.g., 0x27 or 0x3C for LCD display or OLED, 0x68 for MPU6050).

## Common Causes of "No I2C Devices Found"
1. **Wrong SDA/SCL Pin Connections**:
   - Arduino Uno/Nano: SDA = A4, SCL = A5
   - ESP32: SDA = GPIO 21, SCL = GPIO 22
   - Raspberry Pi Pico: SDA = GP4, SCL = GP5
2. **Missing Pull-up Resistors**: I2C bus lines are open-drain and require 4.7k ohm pull-up resistors to VCC if not built into the breakout module.
3. **Address Mismatch**: Code assumes 0x27 (PCF8574T) while hardware module uses 0x3F (PCF8574AT).

## Remediation Protocol
1. Flash an **I2C Scanner sketch** to sweep addresses 0x01 through 0x7F and print discovered hex addresses to Serial Monitor.
2. Verify SDA and SCL are connected correctly (do NOT cross SDA to SCL).
3. Confirm VCC is supplying 3.3V or 5V according to module specifications.
