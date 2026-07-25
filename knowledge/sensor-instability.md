# Analog & Digital Sensor Instability and Noise Reduction

## Summary
Analog sensors (potentiometers, thermistors, LDRs, strain gauges) read voltage levels via Analog-to-Digital Converters (ADCs). High environmental electromagnetic interference (EMI) or power rail ripple causes read noise and fluctuating values.

## Noise Mitigation Techniques
1. **Exponential Moving Average (EMA) Filtering in Software**:
   `filteredValue = (alpha * rawValue) + ((1 - alpha) * previousFiltered);` (where alpha = 0.1 to 0.2).
2. **Hardware Bypass Capacitors**: Place a 0.1uF ceramic capacitor in parallel across the sensor analog signal pin and GND pin close to the sensor.
3. **Twisted Pair Wires**: Twist signal and GND wires together for wire runs exceeding 15 cm.
