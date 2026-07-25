# Arduino Power Loop & Brownout Troubleshooting

## Summary
Arduino microcontrollers require a stable supply voltage (4.75V - 5.25V for 5V boards like Uno/Nano). When high-current peripherals like motors, servos, or relays are triggered, the current spike can pull the 5V rail down below the microcontroller's Brownout Reset (BOR) threshold (~4.3V), causing the Arduino to continuously reset in a power loop.

## Symptoms
- Arduino resets every time a motor or relay is turned on.
- Serial monitor reconnects continuously or displays startup messages in a loop.
- Built-in LED (L) blinks repeatedly on boot.

## Common Root Causes
1. **Powering peripherals directly from Arduino 5V/3.3V pins**: The onboard 5V regulator (AMS1117-5.0) can only supply ~500mA from 12V VIN or USB.
2. **Missing Decoupling Capacitors**: Lack of 100uF - 470uF electrolytic capacitors near heavy load power pins.
3. **Weak USB Power Source**: Computer USB port or cheap hub limiting current to 100mA or 500mA.

## Remediation Steps
1. Power motors, servos, and solenoids from an external DC power supply or separate battery pack.
2. Connect a 220uF to 1000uF electrolytic capacitor across VCC and GND near the motor driver/servo connector to absorb voltage dips.
3. Ensure the ground wire of the external power supply is tied directly to Arduino GND (Common Ground).
