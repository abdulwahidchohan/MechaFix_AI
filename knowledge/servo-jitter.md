# RC Servo Motor Jittering & Unstability

## Summary
RC Hobby Servos (SG90, MG995, MG996R) use PWM signal pulses (typically 1ms to 2ms every 20ms) to maintain arm position. Jittering (vibrating or buzzing continuously) occurs when power rails dip, PWM timing is corrupted by software interrupts, or ground noise enters the control line.

## Common Root Causes
1. **Insufficient Current**: An SG90 micro servo draws ~500mA stall current; an MG996R draws up to 2.5A. Powering servos directly from an Arduino 5V pin causes supply voltage droop.
2. **Software Timer Conflicts**: Standard Arduino `Servo.h` library uses Timer 1, which conflicts with SoftwareSerial or PWM on pins 9/10.
3. **No Common Ground**: Connecting servo VCC/GND to an external battery without tying battery (-) to Arduino GND causes signal float.

## Remediation Steps
1. Power servos with a dedicated 5V to 6V power supply (e.g., 4x AA batteries or 5V 3A UBEC buck regulator).
2. Connect a 470uF capacitor across the servo power terminals.
3. Verify Arduino GND is connected to the external servo power supply negative terminal.
4. If using ESP32, use `ESP3232PWM` or `ESP32Servo` libraries with hardware LEDC timer channels.
