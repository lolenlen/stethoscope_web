let uartTx, uartRx;

// Append text to log area
function log(msg) {
  const logBox = document.getElementById("log");
  logBox.textContent += msg + "\n";
  logBox.scrollTop = logBox.scrollHeight;
}

// Show session output seconds
function logSession(seconds) {
  const sessionBox = document.getElementById("session");
  sessionBox.textContent = seconds.toFixed(2) + " seconds\n";
}

// Connect to BLE
document.getElementById("connectBtn").onclick = async () => {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ name: "Stethoscope_BLE" }],
      optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"],
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(
      "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
    );

    uartTx = await service.getCharacteristic(
      "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
    );

    uartRx = await service.getCharacteristic(
      "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
    );

    await uartRx.startNotifications();
    uartRx.addEventListener("characteristicvaluechanged", (event) => {
      const raw = new TextDecoder().decode(event.target.value).trim();
      log("> " + raw);

      // A session result is always a floating number (seconds)
      if (!isNaN(parseFloat(raw))) {
        logSession(parseFloat(raw));
      }
    });

    document.getElementById("controls").style.display = "block";
    log("Connected to " + device.name);

  } catch (e) {
    log("Error: " + e);
  }
};

// SEND CONFIG button
document.getElementById("sendConfigBtn").onclick = async () => {
  if (!uartTx) return;

  let bpm = document.getElementById("bpmInput").value;
  let s   = document.getElementById("stomachSel").value;
  let b   = document.getElementById("breathingSel").value;

  const configString = `${bpm},${s},${b}\n`;

  // Clear previous session result
  document.getElementById("session").textContent = "";

  // Send BLE command
  await uartTx.writeValue(new TextEncoder().encode(configString));

  log("< " + configString.trim());
};
