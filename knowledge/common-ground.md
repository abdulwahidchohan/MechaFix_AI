# Common Ground (Shared Reference) Requirement

## Summary
In any circuit containing multiple power sources (e.g., 5V Arduino powered via USB and 12V DC motor powered via external supply), all sub-circuits MUST share a single common ground connection. Without a shared ground reference, control signals (PWM, I2C, SPI, digital HIGH/LOW) cannot establish a reliable voltage difference relative to the receiving chip.

## Symptoms
- Servos moving erratically or floating when external power is applied.
- Microcontroller failing to detect signals from sensors powered externally.
- Random noise or floating HIGH states on digital inputs.

## Remediation Steps
1. Connect a wire between the GND pin of the microcontroller and the (-) Negative / GND terminal of the external power supply.
2. Verify ground continuity using a multimeter in Continuity mode (beep test).
3. Do NOT connect the positive (+) voltages of different power supplies together (e.g., keep 5V and 12V separate).
