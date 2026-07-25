# Solderless Breadboard Contact Resistance & Split Power Rails

## Summary
Solderless breadboards contain internal metal spring clips. Over time, spring clips degrade, corrode, or expand, resulting in intermittent high contact resistance (up to 5 - 10 ohms).

## Split Power Rail Gotcha
Many full-size 830-point breadboards have a physical break (split) in the top and bottom red (+) and blue (-) power rails halfway down the board.

## Remediation Steps
1. Measure continuity across the length of red and blue power rails with a multimeter. If split, bridge the middle gap with short jumper wires.
2. Avoid inserting thick meter probes or large terminal leads into breadboard holes, which permanently deforms internal spring clips.
3. For circuits carrying >1 Amp (motors, high-power LEDs), bypass breadboard power rails using soldered wires or terminal blocks.
