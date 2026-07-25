# DC Motor Drivers & Flyback Protection

## Summary
Microcontrollers cannot drive inductive loads like DC motors, solenoids, or relays directly from GPIO pins (limited to 20mA - 40mA). Interfacing DC motors requires an H-Bridge driver (L298N, TB6612FNG, DRV8833) or MOSFET circuit capable of bidirectional current control and inductive flyback diode protection.

## Symptoms
- Arduino resets or freezes as soon as motor starts spinning.
- GPIO pin destroyed due to high voltage inductive back-EMF kickback.
- Motor hums at high frequency but lacks torque to turn.

## Remediation Steps
1. NEVER connect a DC motor directly between a microcontroller GPIO pin and GND.
2. Use an H-Bridge motor driver module (TB6612FNG recommended for high efficiency MOSFET stage).
3. Connect flyback Schottky diodes (1N5819 or 1N4007) across motor terminals if not included on driver module.
4. Separate logic supply (VCC 5V) from motor supply (VM / VIN 6V-12V).
