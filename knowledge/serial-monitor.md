# Serial Monitor Baud Rate & Output Garbage

## Summary
Universal Asynchronous Receiver-Transmitter (UART) communication requires transmitter (TX) and receiver (RX) devices to agree on an exact symbol clock rate (Baud Rate, e.g., 9600, 115200).

## Symptoms
- Serial Monitor displays reversed question marks, square symbols `???`, or gibberish text.
- Board hangs after `Serial.begin(...)`.

## Remediation Steps
1. Match the baud rate drop-down in Arduino IDE / Serial Monitor to the exact integer passed in `Serial.begin(115200);`.
2. On ESP32 / ESP8266, initial boot ROM messages print at 74880 or 115200 baud.
3. Cross RX and TX lines when wiring two devices directly (Microcontroller TX -> Peripheral RX; Microcontroller RX -> Peripheral TX).
