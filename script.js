let uartTx, uartRx;

// Append text to log area
function log(msg) {
  const logBox = document.getElementById("log");
  logBox.textContent += msg + "\n";
  logBox.scrollTop = logBox.scrollHeight;
}

// Connect button
document.getElementById("connectBtn").onclick = async () => {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ name: "Stethoscope_BLE" }],
      optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(
      "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
    );

    uartTx = await service.getCharacteristic(
      "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
    ); // write

    uartRx = await service.getCharacteristic(
      "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
    ); // notify

    await uartRx.startNotifications();
    uartRx.addEventListener("characteristicvaluechanged", (event) => {
      const value = new TextDecoder().decode(event.target.value);
      log("> " + value.trim());
    });

    log("Connected to " + device.name);
    document.getElementById("controls").style.display = "block";

  } catch (e) {
    log("Error: " + e);
  }
};

// Send mask buttons
document.querySelectorAll(".maskBtn").forEach((btn) => {
  btn.onclick = async () => {
    let mask = btn.dataset.mask + "\n";
    if (!uartTx) return;

    await uartTx.writeValue(new TextEncoder().encode(mask));
    log("< " + mask.trim());
  };
});
