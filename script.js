let uartTx, uartRx;

// Current mask bits (default = 000)
let maskBits = [0, 0, 0];

// Append text to log area
function log(msg) {
  const logBox = document.getElementById("log");
  logBox.textContent += msg + "\n";
  logBox.scrollTop = logBox.scrollHeight;
}

// Display session duration
function logSession(seconds) {
  const sessionBox = document.getElementById("session");
  sessionBox.textContent = seconds.toFixed(2) + " seconds\n";
}

// Update the mask preview (000 / 101 / 111)
function updateMaskDisplay() {
  const maskDisplay = document.getElementById("maskDisplay");
  maskDisplay.textContent = maskBits.join("");
}

// Connect button
document.getElementById("connectBtn").onclick = async () => {
  try {
    // Request BLE device
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ name: "Stethoscope_BLE" }],
      optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"], // UART service
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(
      "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
    );

    // TX characteristic (send mask to BLE)
    uartTx = await service.getCharacteristic(
      "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
    );

    // RX characteristic (receive NFC/BLE data)
    uartRx = await service.getCharacteristic(
      "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
    );

    // Set up notification listener
    await uartRx.startNotifications();
    uartRx.addEventListener("characteristicvaluechanged", (event) => {
      const raw = new TextDecoder().decode(event.target.value).trim();

      // Always show raw incoming data in the main log
      log("> " + raw);

      // If the incoming BLE value is a float, then it is the session duration
      if (raw.length > 1) { 
        const seconds = parseFloat(raw); 
        if (!isNaN(seconds)) {
          logSession(seconds);
          return;
        }
      };
    });

    log("Connected to " + device.name);

    // Show controls once connected
    document.getElementById("controls").style.display = "block";
  } catch (e) {
    log("Error: " + e);
  }
};

// Bit buttons (toggle 0/1)
document.querySelectorAll(".bitBtn").forEach((btn) => {
  btn.onclick = () => {
    const index = parseInt(btn.dataset.index);

    // Flip bit 0 <-> 1
    maskBits[index] = maskBits[index] === 0 ? 1 : 0;

    // Update button text
    btn.textContent = `${maskBits[index]}`;

    // Update mask preview
    updateMaskDisplay();
  };
});

// SEND MASK button
document.getElementById("sendMaskBtn").onclick = async () => {
  if (!uartTx) return;

  // Build mask string (ex: 101\n)
  const mask = maskBits.join("") + "\n";

  // Reset session output for new session
  document.getElementById("session").textContent = "";

  // Send mask to BLE
  await uartTx.writeValue(new TextEncoder().encode(mask));

  // Log outgoing command
  log("< " + mask.trim());
};
