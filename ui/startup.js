function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runStartupSequence() {
  const overlay = document.createElement("div");
  overlay.className = "startup-overlay";

  overlay.innerHTML = `
    <div class="startup-content">
      <h1>Streaming<span>MAX</span></h1>
      <p id="startupMessage">Initializing Mission Control...</p>

      <div class="startup-progress">
        <div id="startupProgressBar"></div>
      </div>

      <div id="startupChecks" class="startup-checks"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  const checks = [
    "CPU monitoring online",
    "Memory monitoring online",
    "Storage monitoring online",
    "Network monitoring online",
    "Studio detection online",
    "Performance engine online"
  ];

  const checksBox = document.getElementById("startupChecks");
  const progressBar = document.getElementById("startupProgressBar");

  for (let index = 0; index < checks.length; index += 1) {
    const row = document.createElement("p");
    row.textContent = `✓ ${checks[index]}`;
    checksBox.appendChild(row);

    progressBar.style.width = `${((index + 1) / checks.length) * 100}%`;
    await wait(260);
  }

  document.getElementById("startupMessage").textContent = "Cockpit Ready";
  await wait(600);

  overlay.classList.add("startup-hidden");
  await wait(450);
  overlay.remove();
}

window.runStartupSequence = runStartupSequence;
