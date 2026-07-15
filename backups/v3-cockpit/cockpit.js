const gauges = {
  cpu: new Gauge("cpuGauge", "#ff2fcf"),
  ram: new Gauge("ramGauge", "#20d9ff"),
  disk: new Gauge("diskGauge", "#ffd43b"),
  score: new Gauge("scoreGauge", "#45ff78")
};

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function addTimeline(message) {
  const timeline = document.getElementById("timeline");
  if (!timeline) return;

  const row = document.createElement("p");
  row.innerHTML = `<time>${new Date().toLocaleTimeString()}</time>${message}`;
  timeline.prepend(row);

  while (timeline.children.length > 40) {
    timeline.removeChild(timeline.lastChild);
  }
}

function setActiveButton(button) {
  document.querySelectorAll(".modebar button").forEach(item => {
    item.classList.remove("active");
  });

  button.classList.add("active");
}

function setStatusRow(label, value, healthy) {
  const rows = [...document.querySelectorAll(".status-row")];
  const row = rows.find(item => item.children[1]?.textContent.trim() === label);

  if (!row) return;

  const status = row.querySelector("strong");
  if (!status) return;

  status.textContent = value;
  status.style.color = healthy ? "var(--green)" : "var(--red)";
}


async function refreshAtlas() {
  if (!window.streamingMax?.getAtlasMessage) return;

  try {
    const atlas = await window.streamingMax.getAtlasMessage();

    setText("atlasGreeting", atlas.greeting);
    setText("atlasSummary", atlas.summary);
    setText("atlasState", atlas.state);

    const recommendations = document.getElementById("atlasRecommendations");

    if (recommendations) {
      recommendations.innerHTML = atlas.advice
        .map(message => `<p>• ${message}</p>`)
        .join("");
    }

    const panel = document.querySelector(".atlas-panel");

    if (panel) {
      panel.classList.remove("ready", "warning", "danger");

      if (atlas.state === "DANGER") {
        panel.classList.add("danger");
      } else if (atlas.state === "WARNING") {
        panel.classList.add("warning");
      } else {
        panel.classList.add("ready");
      }
    }
  } catch (error) {
    addTimeline(`ATLAS error: ${error.message}`);
  }
}

async function refreshCockpit() {
  if (!window.streamingMax) return;

  try {
    const [stats, studio] = await Promise.all([
      window.streamingMax.getLiveStats(),
      window.streamingMax.detectStudio()
    ]);

    await refreshReadiness();
  await refreshAtlas();

    gauges.cpu.setValue(stats.cpuPercent);
    gauges.ram.setValue(stats.ramPercent);
    gauges.disk.setValue(stats.diskPercent);
    gauges.score.setValue(stats.performanceScore);

    setText("cpuLabel", `${stats.cpuPercent}%`);
    setText("ramLabel", `${stats.ramPercent}%`);
    setText("diskLabel", `${stats.diskPercent}%`);
    setText("scoreLabel", stats.performanceScore);

    setText(
      "missionStatus",
      stats.streamReady ? "SYSTEM READY" : "NEEDS ATTENTION"
    );

    setStatusRow(
      "Rekordbox",
      studio.rekordbox ? "RUNNING" : "OFFLINE",
      studio.rekordbox
    );

    setStatusRow(
      "OBS Studio",
      studio.obs ? "RUNNING" : "OFFLINE",
      studio.obs
    );

    setStatusRow(
      "Network",
      stats.networkHealth.toUpperCase(),
      stats.networkHealth !== "Fair"
    );

    setStatusRow(
      "Audio Interface",
      "NOT CHECKED",
      false
    );

    setStatusRow(
      "Camera",
      "NOT CHECKED",
      false
    );
  } catch (error) {
    addTimeline(`Cockpit refresh error: ${error.message}`);
  }
}

async function runMode(mode, button) {
  setActiveButton(button);
  addTimeline(`${mode} selected.`);

  if (!window.streamingMax) {
    addTimeline("Prototype mode: Electron backend unavailable.");
    return;
  }

  try {
    const result = await window.streamingMax.runMode(mode);
    result.messages.forEach(addTimeline);
    await refreshCockpit();
  } catch (error) {
    addTimeline(`${mode} error: ${error.message}`);
  }
}

document.getElementById("djModeBtn").onclick = event => {
  runMode("DJ Mode", event.currentTarget);
};

document.getElementById("streamModeBtn").onclick = event => {
  runMode("Stream Mode", event.currentTarget);
};

document.getElementById("cleanModeBtn").onclick = event => {
  runMode("Clean Mode", event.currentTarget);
};

document.getElementById("missionScanBtn").onclick = async event => {
  setActiveButton(event.currentTarget);
  setText("missionStatus", "SCANNING");
  addTimeline("Mission Scan started.");

  const checks = [
    "Scanning processor",
    "Checking memory",
    "Checking storage",
    "Checking OBS",
    "Checking Rekordbox",
    "Checking network",
    "Calculating stream score"
  ];

  for (const check of checks) {
    addTimeline(`${check}...`);
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  await runMode("Preflight", event.currentTarget);
  await refreshCockpit();
};

document.getElementById("clearTimelineBtn").onclick = () => {
  document.getElementById("timeline").innerHTML = "";
};

document.getElementById("speedTestBtn").onclick = async event => {
  const button = event.currentTarget;

  button.disabled = true;
  button.textContent = "TESTING...";
  setText("networkQualityStatus", "TESTING");
  addTimeline("Internet speed test started.");

  try {
    const result = await window.streamingMax.runSpeedTest();

    if (!result.success) {
      throw new Error(result.error || "Speed test failed.");
    }

    setText("speedDownload", `${result.downloadMbps} Mbps`);
    setText("speedUpload", `${result.uploadMbps} Mbps`);
    setText("speedResponse", `${result.responsiveness} RPM`);
    setText("networkQualityStatus", result.rating);

    addTimeline(
      `Speed test complete: ${result.downloadMbps} Mbps down, ${result.uploadMbps} Mbps up, ${result.rating}.`
    );
  } catch (error) {
    setText("networkQualityStatus", "ERROR");
    addTimeline(`Speed test error: ${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = "RUN SPEED TEST";
  }
};

async function refreshReadiness() {
  if (!window.streamingMax?.getReadiness) return;

  try {
    const readiness = await window.streamingMax.getReadiness();

    gauges.score.setValue(readiness.score);

    setText("scoreLabel", readiness.score);
    setText("missionStatus", readiness.status);

    const coachMessages = document.querySelectorAll(".coach-message");

    if (coachMessages[0]) {
      coachMessages[0].querySelector("p").textContent =
        readiness.ready
          ? `System ready. Stream Score ${readiness.score}/100 (${readiness.grade}).`
          : `System needs attention. Stream Score ${readiness.score}/100 (${readiness.grade}).`;
    }

    if (coachMessages[1]) {
      coachMessages[1].querySelector("p").textContent =
        readiness.fixes[0] || "All major readiness checks passed.";
    }

    if (coachMessages[2]) {
      coachMessages[2].querySelector("p").textContent =
        readiness.fixes[1] || "No additional recommendations.";
    }
  } catch (error) {
    addTimeline(`Readiness error: ${error.message}`);
  }
}

refreshCockpit();
refreshReadiness();

setInterval(async () => {
  await refreshCockpit();
  await refreshReadiness();
}, 3000);

addTimeline("Cockpit v2 systems online.");
runStartupSequence();