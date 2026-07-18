function setChipState(id, state, label) {
  const chip = document.getElementById(id);

  if (!chip) return;

  chip.classList.remove(
    "online",
    "warning",
    "offline",
    "unknown",
    "scanning"
  );

  chip.classList.add(state);

  if (label) {
    chip.textContent = label;
  }
}

function updateV2Clock() {
  const clock = document.getElementById("v2Clock");

  if (!clock) return;

  clock.textContent = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function updateV2Briefing({ stats, studio }) {
  const headline =
    document.getElementById("v2BriefingHeadline");

  const message =
    document.getElementById("v2BriefingMessage");

  const action =
    document.getElementById("v2BriefingAction");

  const priority =
    document.getElementById("v2BriefingPriority");

  if (!headline || !message || !action || !priority) {
    return;
  }

  if (!studio.obs) {
    priority.textContent = "RECOMMENDATION";
    headline.textContent =
      "Your mission is almost ready.";

    message.textContent =
      "OBS is not running yet. Launch it before beginning your stream.";

    action.textContent = "Launch OBS";
    return;
  }

  if (
    stats.networkHealth === "Poor" ||
    stats.networkHealth === "Offline"
  ) {
    priority.textContent = "MISSION ALERT";
    headline.textContent =
      "Internet conditions need attention.";

    message.textContent =
      "ATLAS recommends checking your connection before going live.";

    action.textContent = "Review network status";
    return;
  }

  if (!stats.sleepPreventionActive) {
    priority.textContent = "RECOMMENDATION";
    headline.textContent =
      "Enable Sleep Guard before your mission.";

    message.textContent =
      "Sleep Guard prevents the computer from sleeping during a live session.";

    action.textContent = "Enable Sleep Guard";
    return;
  }

  priority.textContent = "MISSION READY";
  headline.textContent =
    "Your primary mission systems are ready.";

  message.textContent =
    "No immediate issues were detected. ATLAS recommends proceeding.";

  action.textContent = "Prepare Mission";
}

async function refreshV2CommandBar() {
  try {
    const stats =
      await window.streamingMax.getLiveStats();

    const studio =
      await window.streamingMax.detectStudio();

    updateV2Briefing({
      stats,
      studio
    });

    setChipState(
      "v2ObsChip",
      studio.obs ? "online" : "offline",
      studio.obs ? "OBS ONLINE" : "OBS OFFLINE"
    );

    const rawNetworkHealth =
      String(stats.networkHealth || "")
        .trim()
        .toLowerCase();

    let networkState = "scanning";
    let networkLabel = "INTERNET CHECKING";

    if (
      rawNetworkHealth === "excellent" ||
      rawNetworkHealth === "good"
    ) {
      networkState = "online";
      networkLabel = "INTERNET READY";
    } else if (rawNetworkHealth === "fair") {
      networkState = "warning";
      networkLabel = "INTERNET NEEDS REVIEW";
    } else if (
      rawNetworkHealth === "poor" ||
      rawNetworkHealth === "offline"
    ) {
      networkState = "offline";
      networkLabel = "INTERNET NOT READY";
    }

    setChipState(
      "v2NetworkChip",
      networkState,
      networkLabel
    );

    setChipState(
      "v2SleepChip",
      stats.sleepPreventionActive
        ? "online"
        : "warning",
      stats.sleepPreventionActive
        ? "SLEEP GUARD ON"
        : "SLEEP GUARD OFF"
    );

    setChipState(
      "v2Rx3Chip",
      "unknown",
      "RX3 UNKNOWN"
    );

    setChipState(
      "v2CameraChip",
      "unknown",
      "CAMERA UNKNOWN"
    );

    setChipState(
      "v2ScarlettChip",
      "unknown",
      "SCARLETT UNKNOWN"
    );
  } catch (error) {
    console.error(
      "V2 command bar refresh error:",
      error
    );

    [
      "v2Rx3Chip",
      "v2ObsChip",
      "v2CameraChip",
      "v2ScarlettChip",
      "v2NetworkChip",
      "v2SleepChip"
    ].forEach(id => {
      setChipState(id, "unknown");
    });
  }
}

function initializeV2PanelTabs() {
  document.querySelectorAll(".mission-panel").forEach(panel => {
    const tabs = panel.querySelectorAll("[data-panel-tab]");
    const views = panel.querySelectorAll("[data-panel-view]");

    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.panelTab;

        tabs.forEach(item => {
          item.classList.toggle("active", item === tab);
        });

        views.forEach(view => {
          view.classList.toggle(
            "active",
            view.dataset.panelView === target
          );
        });
      });
    });
  });
}

document.addEventListener(
  "DOMContentLoaded",
  initializeV2PanelTabs
);

function initializeDepartmentNavigation() {
  const tabs =
    document.querySelectorAll("[data-department]");

  const views =
    document.querySelectorAll("[data-department-view]");

  const savedDepartment =
    localStorage.getItem("streamingMaxV2Department") ||
    "home";

  function activateDepartment(department) {
    tabs.forEach(tab => {
      tab.classList.toggle(
        "active",
        tab.dataset.department === department
      );
    });

    views.forEach(view => {
      view.classList.toggle(
        "active",
        view.dataset.departmentView === department
      );
    });

    localStorage.setItem(
      "streamingMaxV2Department",
      department
    );
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      activateDepartment(tab.dataset.department);
    });
  });

  const departmentExists =
    [...views].some(
      view =>
        view.dataset.departmentView === savedDepartment
    );

  activateDepartment(
    departmentExists
      ? savedDepartment
      : "home"
  );
}

document.addEventListener(
  "DOMContentLoaded",
  initializeDepartmentNavigation
);

function initializeHomeV3Navigation() {
  document
    .querySelectorAll("[data-open-department]")
    .forEach(control => {
      control.addEventListener("click", () => {
        const department =
          control.dataset.openDepartment;

        const departmentTab =
          document.querySelector(
            `[data-department="${department}"]`
          );

        if (departmentTab) {
          departmentTab.click();
        }
      });
    });
}

document.addEventListener(
  "DOMContentLoaded",
  initializeHomeV3Navigation
);

/* ===== Home V3 Live Mission Briefing ===== */

let homeV3RefreshTimer = null;

function setHomeText(id, value) {
  const element = document.getElementById(id);

  if (!element) return;

  element.textContent = value;
}

function formatHomeNumber(value, suffix = "") {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return `--${suffix}`;
  }

  return `${number}${suffix}`;
}

function formatHomeMbps(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "-- Mbps";
  }

  return `${number.toFixed(2)} Mbps`;
}

function setHomeReport(id, state, message) {
  const row = document.getElementById(id);

  if (!row) return;

  const light = row.querySelector(".report-light");

  if (light) {
    light.classList.remove(
      "checking",
      "ready",
      "warning",
      "offline"
    );

    light.classList.add(state);
  }

  const textNode = [...row.childNodes].find(
    node => node.nodeType === Node.TEXT_NODE
  );

  if (textNode) {
    textNode.textContent = ` ${message}`;
  } else {
    row.append(` ${message}`);
  }
}

function setHomeMissionBadge(status, score) {
  const badge =
    document.getElementById("homeMissionBadge");

  if (!badge) return;

  badge.classList.remove(
    "checking",
    "ready",
    "warning"
  );

  const normalized =
    String(status || "")
      .trim()
      .toLowerCase();

  if (
    normalized === "system ready" ||
    Number(score) >= 85
  ) {
    badge.classList.add("ready");
    badge.textContent =
      `MISSION READY • ${Number(score) || 0}%`;
    return;
  }

  if (
    normalized === "needs attention" ||
    Number(score) >= 70
  ) {
    badge.classList.add("warning");
    badge.textContent =
      `NEEDS ATTENTION • ${Number(score) || 0}%`;
    return;
  }

  badge.classList.add("checking");

  badge.textContent =
    Number(score) > 0
      ? `MISSION CHECK • ${Number(score)}%`
      : "CHECKING SYSTEMS";
}

function updateHomePerformance(state) {
  const performance = state.performance || {};

  const status =
    String(performance.status || "checking")
      .toLowerCase();

  setHomeText(
    "homeCpuValue",
    formatHomeNumber(
      performance.cpuPercent,
      "%"
    )
  );

  setHomeText(
    "homeMemoryValue",
    formatHomeNumber(
      performance.memoryPercent,
      "%"
    )
  );

  setHomeText(
    "homeImpactValue",
    String(
      performance.missionImpact || "checking"
    ).toUpperCase()
  );

  setHomeText(
    "homePerformanceStatus",
    status === "healthy"
      ? "HEALTHY"
      : status === "warning"
        ? "REVIEW"
        : status === "attention"
          ? "ATTENTION"
          : "CHECKING"
  );

  if (status === "healthy") {
    setHomeReport(
      "homePerformanceReport",
      "ready",
      "Performance looks healthy."
    );
  } else if (status === "warning") {
    setHomeReport(
      "homePerformanceReport",
      "warning",
      "Performance is tighter than usual."
    );
  } else if (status === "attention") {
    setHomeReport(
      "homePerformanceReport",
      "offline",
      "Performance needs attention."
    );
  } else {
    setHomeReport(
      "homePerformanceReport",
      "checking",
      "Performance is being evaluated."
    );
  }
}

function updateHomeNetwork(state) {
  const network = state.network || {};

  const status =
    String(network.status || "checking")
      .toLowerCase();

  setHomeText(
    "homeDownloadValue",
    formatHomeMbps(network.downloadMbps)
  );

  setHomeText(
    "homeUploadValue",
    formatHomeMbps(network.uploadMbps)
  );

  setHomeText(
    "homeLatencyValue",
    Number.isFinite(Number(network.latencyMs))
      ? `${Number(network.latencyMs)} ms`
      : "-- ms"
  );

  if (status === "ready") {
    setHomeText(
      "homeNetworkStatus",
      "READY"
    );

    setHomeReport(
      "homeNetworkReport",
      "ready",
      "Internet is ready."
    );
  } else if (status === "warning") {
    setHomeText(
      "homeNetworkStatus",
      "REVIEW"
    );

    setHomeReport(
      "homeNetworkReport",
      "warning",
      "Internet conditions deserve a closer look."
    );
  } else if (status === "offline") {
    setHomeText(
      "homeNetworkStatus",
      "OFFLINE"
    );

    setHomeReport(
      "homeNetworkReport",
      "offline",
      "Internet connection needs attention."
    );
  } else {
    setHomeText(
      "homeNetworkStatus",
      "CHECKING"
    );

    setHomeReport(
      "homeNetworkReport",
      "checking",
      "Internet readiness is being checked."
    );
  }
}

function updateHomeStudio(state) {
  const studio = state.studio || {};

  const status =
    String(studio.status || "checking")
      .toLowerCase();

  setHomeText(
    "homeObsValue",
    studio.obsRunning
      ? "ONLINE"
      : "OFFLINE"
  );

  setHomeText(
    "homeRx3Value",
    studio.rx3Connected === true
      ? "CONNECTED"
      : studio.rx3Connected === false
        ? "NOT FOUND"
        : "UNKNOWN"
  );

  setHomeText(
    "homeAudioValue",
    studio.audioInterfaceConnected === true
      ? "CONNECTED"
      : studio.audioInterfaceConnected === false
        ? "NOT FOUND"
        : "UNKNOWN"
  );

  setHomeText(
    "homeStudioStatus",
    status === "ready"
      ? "READY"
      : status === "partial"
        ? "PARTIAL"
        : status === "standby"
          ? "STANDBY"
          : "CHECKING"
  );

  if (status === "ready") {
    setHomeReport(
      "homeStudioReport",
      "ready",
      "OBS and Rekordbox are online."
    );
  } else if (status === "partial") {
    setHomeReport(
      "homeStudioReport",
      "warning",
      "Part of the studio is online."
    );
  } else if (status === "standby") {
    setHomeReport(
      "homeStudioReport",
      "warning",
      "Studio applications are standing by."
    );
  } else {
    setHomeReport(
      "homeStudioReport",
      "checking",
      "Studio equipment detection is standing by."
    );
  }
}

function updateHomeRecommendation(
  recommendation
) {
  if (!recommendation) return;

  setHomeText(
    "homeAtlasRecommendation",
    recommendation.headline ||
      "I’m reviewing the mission."
  );

  setHomeText(
    "homeAtlasObservation",
    recommendation.message ||
      "Give me a moment to finish checking."
  );

  const primaryButton =
    document.getElementById("homePrepareMission");

  if (primaryButton) {
    primaryButton.dataset.actionType =
      recommendation.actionType || "";

    primaryButton.title =
      recommendation.action || "";
  }
}

function updateHomeV3Mission(payload) {
  if (!payload || !payload.state) {
    return;
  }

  const { state, recommendation } = payload;

  updateHomePerformance(state);
  updateHomeNetwork(state);
  updateHomeStudio(state);

  setHomeMissionBadge(
    state.mission?.status,
    state.mission?.readinessScore
  );

  updateHomeRecommendation(recommendation);
}

async function refreshHomeV3Mission() {
  try {
    if (
      !window.streamingMax ||
      typeof window.streamingMax.getMissionState
        !== "function"
    ) {
      throw new Error(
        "Mission State bridge is unavailable."
      );
    }

    const payload =
      await window.streamingMax.getMissionState();

    updateHomeV3Mission(payload);
  } catch (error) {
    console.error(
      "Home V3 mission refresh failed:",
      error
    );

    setHomeText(
      "homeAtlasRecommendation",
      "I couldn’t complete the latest system check."
    );

    setHomeText(
      "homeAtlasObservation",
      "The dashboard is still available. We’ll reconnect the live briefing next."
    );

    setHomeMissionBadge("checking", 0);
  }
}

function initializeHomeV3Mission() {
  refreshHomeV3Mission();

  if (homeV3RefreshTimer) {
    clearInterval(homeV3RefreshTimer);
  }

  homeV3RefreshTimer = setInterval(
    refreshHomeV3Mission,
    5000
  );
}

document.addEventListener(
  "DOMContentLoaded",
  initializeHomeV3Mission
);
