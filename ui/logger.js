function addLog(message) {
  const logBox = document.getElementById("logBox");
  if (!logBox) return;

  const p = document.createElement("p");
  p.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
  logBox.prepend(p);

  while (logBox.children.length > 80) {
    logBox.removeChild(logBox.lastChild);
  }
}

window.addLog = addLog;
