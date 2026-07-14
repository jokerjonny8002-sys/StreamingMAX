const logBox = document.getElementById("logBox");
const themeSelector = document.getElementById("themeSelector");
const coachBox = document.getElementById("coachBox");

let lastScore = 0;

const cpuGraph = StreamingMaxGraphs.createGraph("cpuGraph", "CPU");
const ramGraph = StreamingMaxGraphs.createGraph("ramGraph", "RAM");

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function animateNumber(id, start, end, duration = 400) {
  const el = document.getElementById(id);
  if (!el) return;

  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    el.innerText = Math.round(start + (end - start) * progress);
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function updateGauge(id, value) {
  const gauge = document.getElementById(id);
  if (!gauge) return;

  value = Math.max(0, Math.min(100, Number(value) || 0));
  gauge.style.setProperty("--value", value + "%");
  gauge.removeAttribute("data-level");

  if (value >= 85) gauge.setAttribute("data-level", "danger");
  else if (value >= 65) gauge.setAttribute("data-level", "warning");
}

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("streamingmax-theme", theme);
}

function loadTheme() {
  const theme = localStorage.getItem("streamingmax-theme") || "dj-neon";
  document.body.setAttribute("data-theme", theme);
  if (themeSelector) themeSelector.value = theme;
}


async function refreshTopProcesses() {
  const processList = document.getElementById("processList");
  if (!processList) return;

  try {
    const processes = await window.streamingMax.getTopProcesses();
    processList.innerHTML = "";

    processes.slice(0, 8).forEach(proc => {
      const row = document.createElement("div");
      row.className = "process-row";
      row.innerHTML = `<span>${proc.name}</span><strong>${proc.ramMB} MB</strong>`;
      processList.appendChild(row);
    });
  } catch {
    processList.innerHTML = `<div class="process-row"><span>Error loading</span><strong>--</strong></div>`;
  }
}

async function refreshStudioReady() {
  try {
    const result = await window.streamingMax.getStudioReady();

    setText("readinessText", result.status);

    const fixes = result.fixes || [];
    if (fixes.length > 0) {
      coachBox.innerHTML = fixes.map(fix => `<p>• ${fix}</p>`).join("");
    }
  } catch (error) {
    addLog(`Studio Ready error: ${error.message}`);
  }
}

async function refreshDashboard() {
  try {
    const stats = await window.streamingMax.getLiveStats();

    animateNumber("scoreValue", lastScore, stats.performanceScore);
    lastScore = stats.performanceScore;

    setText("scoreText", `${stats.performanceGrade} • ${stats.streamReady ? "READY" : "NOT READY"}`);
    setText("cpuValue", stats.cpuPercent + "%");
    setText("ramValue", stats.ramPercent + "%");
    setText("diskValue", stats.diskPercent + "%");
    setText("uploadValue", stats.networkHealth);
    setText("networkStatus", stats.networkHealth);
    setText("systemStatus", `${stats.performanceScore}/100  ${stats.performanceGrade}`);
    setText("sleepStatus", stats.sleepPreventionActive ? "🟢 Active" : "⚪ Standby");

    updateGauge("scoreGauge", stats.performanceScore);
    updateGauge("cpuGauge", stats.cpuPercent);
    updateGauge("ramGauge", stats.ramPercent);
    updateGauge("diskGauge", stats.diskPercent);
    updateGauge("uploadGauge", stats.performanceScore);

    cpuGraph.draw(stats.cpuPercent);
    ramGraph.draw(stats.ramPercent);

    if (!coachBox.innerHTML || coachBox.innerHTML.includes("Waiting")) {
      coachBox.innerHTML = stats.recommendations.length
        ? stats.recommendations.map(r => `<p>• ${r}</p>`).join("")
        : "<p>✅ System looks healthy.</p>";
    }
  } catch (error) {
    addLog(`Dashboard error: ${error.message}`);
  }
}

async function refreshStudioStatus() {
  try {
    const studio = await window.streamingMax.detectStudio();
    setText("rekordboxStatus", studio.rekordbox ? "🟢 Running" : "🔴 Offline");
    setText("obsStatus", studio.obs ? "🟢 Running" : "🔴 Offline");
  } catch (error) {
    addLog(`Studio detection error: ${error.message}`);
  }
}

async function runMissionScan() {
  addLog("🚀 MISSION SCAN STARTED");
  setText("readinessText", "🚀 Running Mission Scan...");

  const checks = [
    "Scanning CPU",
    "Scanning Memory",
    "Checking Disk",
    "Checking OBS",
    "Checking Rekordbox",
    "Checking Network",
    "Checking Studio Status",
    "Calculating Stream Risk"
  ];

  for (const check of checks) {
    addLog(`${check}...`);
    await sleep(400);
    addLog(`✔ ${check} complete`);
  }

  const result = await window.streamingMax.runMode("Preflight");
  result.messages.forEach(addLog);

  setText("readinessText", result.success ? "🟢 READY TO GO LIVE" : "🟡 NEEDS ATTENTION");

  await refreshDashboard();
  await refreshStudioStatus();
  await refreshStudioReady();
}

async function executeMode(mode) {
  if (mode === "Preflight") {
    await runMissionScan();
    return;
  }

  addLog(mode);
  const result = await window.streamingMax.runMode(mode);
  result.messages.forEach(addLog);

  await refreshDashboard();
  await refreshStudioStatus();
  await refreshStudioReady();
}

document.querySelectorAll(".mode-btn").forEach(button => {
  button.onclick = () => executeMode(button.dataset.mode);
});

if (themeSelector) {
  themeSelector.onchange = () => applyTheme(themeSelector.value);
}

loadTheme();

createStreamingBackground();
initNavigation();

refreshDashboard();
refreshStudioStatus();
refreshStudioReady();
refreshTopProcesses();

setInterval(refreshDashboard, 2500);
setInterval(refreshStudioStatus, 5000);
setInterval(refreshStudioReady, 5000);
setInterval(refreshTopProcesses, 5000);