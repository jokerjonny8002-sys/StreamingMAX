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

let preflightRunning = false;
async function runPreflightSequence() {
  if (preflightRunning) return;
preflightRunning = true;
  const button = document.getElementById("runPreflightBtn");
  const status = document.getElementById("preflightStatus");

  if (!button || !status) return;

  button.disabled = true;
  button.textContent = "SCANNING...";
  status.textContent = "SCANNING";

  document.querySelectorAll(".preflight-row").forEach(row => {
    row.classList.remove("pass", "warning", "fail");

    const result = row.querySelector("strong");
    if (result) result.textContent = "CHECKING";
  });

  try {
    const checks = await window.streamingMax.runPreflightCheck();

    for (const check of checks) {
      const row = document.querySelector(
        `.preflight-row[data-check="${check.id}"]`
      );

      if (!row) continue;

      await new Promise(resolve => setTimeout(resolve, 350));

      row.classList.remove("pass", "warning", "fail");
      row.classList.add(check.ok ? "pass" : "fail");

      const result = row.querySelector("strong");
      if (result) result.textContent = check.text;

      addTimeline(
        `Pre-flight: ${check.id.toUpperCase()} ${check.ok ? "passed" : "failed"}.`
      );
    }

    const failed = checks.filter(check => !check.ok);

    status.textContent = failed.length
      ? `${failed.length} ISSUE${failed.length === 1 ? "" : "S"}`
      : "ALL SYSTEMS GO";

    addTimeline(
      failed.length
        ? `Pre-flight complete with ${failed.length} issue(s).`
        : "Pre-flight complete. All systems go."
    );

    await refreshAtlas();
  } catch (error) {
    status.textContent = "ERROR";
    addTimeline(`Pre-flight error: ${error.message}`);
  } finally {
    preflightRunning = false;
    button.disabled = false;
    button.textContent = "RUN PRE-FLIGHT";
  }
}

document.getElementById("runPreflightBtn").onclick = runPreflightSequence;

const cockpitWait = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

const atlasObsBtn = document.getElementById("atlasObsBtn");

if (atlasObsBtn) {
  atlasObsBtn.onclick = async () => {
    atlasObsBtn.disabled = true;
    atlasObsBtn.textContent = "OPENING OBS...";
    addTimeline("ATLAS: Launching OBS...");

    try {
      const result =
        await window.streamingMax.launchStudioApp("obs");

      addTimeline(`ATLAS: ${result.message}`);
      await cockpitWait(2500);

      await refreshCockpit();
      await refreshReadiness();
      await refreshAtlas();

      addTimeline("ATLAS: OBS detection refreshed.");
    } catch (error) {
      addTimeline(
        `ATLAS: OBS launch error: ${error.message}`
      );
    } finally {
      atlasObsBtn.disabled = false;
      atlasObsBtn.textContent = "OPEN OBS";
    }
  };
}

const atlasRekordboxBtn =
  document.getElementById("atlasRekordboxBtn");

if (atlasRekordboxBtn) {
  atlasRekordboxBtn.onclick = async () => {
    atlasRekordboxBtn.disabled = true;
    atlasRekordboxBtn.textContent =
      "OPENING REKORDBOX...";

    addTimeline("ATLAS: Launching Rekordbox...");

    try {
      const result =
        await window.streamingMax.launchStudioApp(
          "rekordbox"
        );

      addTimeline(`ATLAS: ${result.message}`);
      await cockpitWait(2500);

      await refreshCockpit();
      await refreshReadiness();
      await refreshAtlas();

      addTimeline(
        "ATLAS: Rekordbox detection refreshed."
      );
    } catch (error) {
      addTimeline(
        `ATLAS: Rekordbox launch error: ${error.message}`
      );
    } finally {
      atlasRekordboxBtn.disabled = false;
      atlasRekordboxBtn.textContent =
        "OPEN REKORDBOX";
    }
  };
}

async function refreshSleepGuard() {
  if (!window.streamingMax?.getSleepGuard) return;

  try {
    const result =
      await window.streamingMax.getSleepGuard();

    const button =
      document.getElementById("sleepToggleBtn");

    const atlasButton =
      document.getElementById("atlasSleepBtn");

    const light =
      document.getElementById("sleepLight");

    if (button) {
      button.textContent = result.enabled ? "ON" : "OFF";
      button.classList.toggle(
        "active",
        result.enabled
      );
    }

    if (atlasButton) {
      atlasButton.textContent = result.enabled
        ? "DISABLE SLEEP GUARD"
        : "ENABLE SLEEP GUARD";

      atlasButton.classList.toggle(
        "active",
        result.enabled
      );
    }

    if (light) {
      light.classList.toggle(
        "online",
        result.enabled
      );
    }
  } catch (error) {
    addTimeline(
      `Sleep Guard status error: ${error.message}`
    );
  }
}

async function loadProfileSetup() {
  const setup = document.getElementById("profileSetup");
  const saveButton = document.getElementById("saveProfileBtn");
  const errorText = document.getElementById("profileError");

  if (!setup || !saveButton) return;

  try {
    const profile = await window.streamingMax.getProfile();

    if (!profile.setupComplete) {
      setup.classList.remove("hidden");
    } else {
      setup.classList.add("hidden");
      await refreshAtlas();
    }

    saveButton.onclick = async () => {
      const realName =
        document.getElementById("profileRealName").value.trim();

      const djName =
        document.getElementById("profileDjName").value.trim();

      const nickname =
        document.getElementById("profileNickname").value.trim();

      const preferredNameType =
        document.getElementById("profilePreferredName").value;

      const selectedName = {
        realName,
        djName,
        nickname
      }[preferredNameType];

      if (!selectedName) {
        errorText.textContent =
          "Enter the name you selected for ATLAS to use.";
        return;
      }

      saveButton.disabled = true;
      saveButton.textContent = "SAVING...";
      errorText.textContent = "";

      try {
        const saved = await window.streamingMax.saveProfile({
          realName,
          djName,
          nickname,
          preferredNameType,
          atlasPersonality: "casual"
        });

        setup.classList.add("hidden");

        addTimeline(
          `ATLAS: Profile saved. Welcome, ${saved.displayName}.`
        );

        await refreshAtlas();
      } catch (error) {
        errorText.textContent =
          `Could not save profile: ${error.message}`;
      } finally {
        saveButton.disabled = false;
        saveButton.textContent = "SAVE PROFILE";
      }
    };
  } catch (error) {
    addTimeline(`Profile loading error: ${error.message}`);
  }
}


async function toggleSleepGuard() {
  const button =
    document.getElementById("sleepToggleBtn");


  const currentlyEnabled =
    button?.textContent.trim() === "ON";

  try {
    const result =
      await window.streamingMax.setSleepGuard(
        !currentlyEnabled
      );

    addTimeline(`ATLAS: ${result.message}`);

    await refreshSleepGuard();
    await refreshCockpit();
    await refreshReadiness();
    await refreshAtlas();
  } catch (error) {
    addTimeline(
      `Sleep Guard error: ${error.message}`
    );
  }
}

const sleepToggleBtn =
  document.getElementById("sleepToggleBtn");

if (sleepToggleBtn) {
  sleepToggleBtn.onclick = async () => {
    sleepToggleBtn.disabled = true;

    await toggleSleepGuard();

    sleepToggleBtn.disabled = false;
  };
}

const atlasSleepBtn =
  document.getElementById("atlasSleepBtn");

if (atlasSleepBtn) {
  atlasSleepBtn.onclick = async () => {
    atlasSleepBtn.disabled = true;

    await toggleSleepGuard();

    atlasSleepBtn.disabled = false;
  };
}

const atlasScanBtn =
  document.getElementById("atlasScanBtn");

if (atlasScanBtn) {
  atlasScanBtn.onclick = runPreflightSequence;
}

refreshSleepGuard();

async function loadProfile() {
  try {
    const profile = await window.streamingMax.getProfile();

    console.log("PROFILE:", profile);

    if (!profile.setupComplete) {
      addTimeline("ATLAS: No profile found.");
    } else {
      addTimeline(
        `ATLAS: Welcome back, ${profile.displayName}.`
      );
    }
  } catch (error) {
    console.error(error);
  }
}

loadProfile();

addTimeline("Cockpit v2 systems online.");
runStartupSequence();

loadProfileSetup();

// ===== Studio Builder =====

async function getStudioProfile() {
  const profile = await window.streamingMax.getProfile();

  return {
    ...profile,
    studioEquipment: Array.isArray(profile.studioEquipment)
      ? profile.studioEquipment
      : []
  };
}

function renderEquipmentResults(devices = []) {
  const results = document.getElementById("equipmentResults");
  const count = document.getElementById("equipmentCount");

  if (!results) return;

  if (count) {
    count.textContent =
      `${devices.length} DEVICE${devices.length === 1 ? "" : "S"}`;
  }

  if (!devices.length) {
    results.innerHTML = `
      <p class="equipment-empty">
        No matching equipment found.
      </p>
    `;
    return;
  }

  results.innerHTML = devices.map(device => `
    <article class="equipment-result">
      <div>
        <h4>${device.brand} ${device.name}</h4>
        <p>
          ${device.equipmentType} ·
          ${(device.software || []).join(", ") || "No software listed"}
        </p>
      </div>

      <button
        type="button"
        data-add-equipment="${device.id}"
      >
        ADD
      </button>
    </article>
  `).join("");

  results.querySelectorAll("[data-add-equipment]")
    .forEach(button => {
      button.onclick = async () => {
        await addEquipmentToStudio(
          button.dataset.addEquipment
        );
      };
    });
}

async function renderMyStudio() {
  const list = document.getElementById("myStudioList");
  const count = document.getElementById("myStudioCount");

  if (!list) return;

  const profile = await getStudioProfile();
  const ids = profile.studioEquipment;

  if (count) {
    count.textContent =
      `${ids.length} ITEM${ids.length === 1 ? "" : "S"}`;
  }

  if (!ids.length) {
    list.innerHTML = `
      <p class="equipment-empty">
        No equipment added yet.
      </p>
    `;
    return;
  }

  const devices = (
    await Promise.all(
      ids.map(id =>
        window.streamingMax.atlasLibraryGet(id)
      )
    )
  ).filter(Boolean);

  list.innerHTML = devices.map(device => `
    <article class="my-studio-item">
      <div>
        <h4>${device.brand} ${device.name}</h4>
        <p>
          ${device.category || device.equipmentType}
        </p>
      </div>

      <button
        type="button"
        data-remove-equipment="${device.id}"
      >
        REMOVE
      </button>
    </article>
  `).join("");

  list.querySelectorAll("[data-remove-equipment]")
    .forEach(button => {
      button.onclick = async () => {
        await removeEquipmentFromStudio(
          button.dataset.removeEquipment
        );
      };
    });
}

async function addEquipmentToStudio(deviceId) {
  try {
    const profile = await getStudioProfile();

    if (!profile.studioEquipment.includes(deviceId)) {
      profile.studioEquipment.push(deviceId);
    }

    await window.streamingMax.saveProfile(profile);
    await renderMyStudio();

    const device =
      await window.streamingMax.atlasLibraryGet(deviceId);

    addTimeline(
      `ATLAS: ${device?.name || deviceId} added to studio.`
    );
  } catch (error) {
    addTimeline(
      `Studio Builder error: ${error.message}`
    );
  }
}

async function removeEquipmentFromStudio(deviceId) {
  try {
    const profile = await getStudioProfile();

    profile.studioEquipment =
      profile.studioEquipment.filter(
        id => id !== deviceId
      );

    await window.streamingMax.saveProfile(profile);
    await renderMyStudio();

    const device =
      await window.streamingMax.atlasLibraryGet(deviceId);

    addTimeline(
      `ATLAS: ${device?.name || deviceId} removed from studio.`
    );
  } catch (error) {
    addTimeline(
      `Studio Builder error: ${error.message}`
    );
  }
}

async function searchStudioEquipment() {
  const input =
    document.getElementById("equipmentSearchInput");

  if (!input) return;

  try {
    const devices =
      await window.streamingMax.atlasLibrarySearch(
        input.value
      );

    renderEquipmentResults(devices);
  } catch (error) {
    addTimeline(
      `Equipment search error: ${error.message}`
    );
  }
}

function initializeStudioBuilder() {
  const searchButton =
    document.getElementById("equipmentSearchBtn");

  const searchInput =
    document.getElementById("equipmentSearchInput");

  if (searchButton) {
    searchButton.onclick = searchStudioEquipment;
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        searchStudioEquipment();
      }
    });
  }

  renderMyStudio();
}

initializeStudioBuilder();

function runBrandSplash() {
  const splash = document.getElementById("brandSplash");
  const bootText = document.getElementById("brandBootText");
  const bootBar = document.getElementById("brandBootBar");
  const bootPercent = document.getElementById("brandBootPercent");

  if (!splash) return;

  const stages = [
    {
      text: "INITIALIZING ATLAS CORE...",
      progress: 12
    },
    {
      text: "LOADING USER PROFILE...",
      progress: 28
    },
    {
      text: "CONNECTING SYSTEM MONITORS...",
      progress: 46
    },
    {
      text: "LOADING STUDIO EQUIPMENT...",
      progress: 63
    },
    {
      text: "CHECKING STREAM SERVICES...",
      progress: 78
    },
    {
      text: "CALIBRATING MISSION CONTROL...",
      progress: 92
    },
    {
      text: "MISSION CONTROL ONLINE.",
      progress: 100
    }
  ];

  let index = 0;

  function showStage() {
    const stage = stages[index];

    if (bootText) {
      bootText.textContent = stage.text;
    }

    if (bootBar) {
      bootBar.style.width = `${stage.progress}%`;
    }

    if (bootPercent) {
      bootPercent.textContent = `${stage.progress}%`;
    }

    if (stage.progress === 100) {
      splash.classList.add("boot-complete");

      setTimeout(() => {
        splash.classList.add("hidden");
      }, 1050);

      return;
    }

    index += 1;
    setTimeout(showStage, 620);
  }

  setTimeout(showStage, 350);
}

runBrandSplash();