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

  let light = row.querySelector(".report-light");

  if (!light) {
    light = document.createElement("span");
    light.className = "report-light";
  }

  light.classList.remove(
    "checking",
    "ready",
    "warning",
    "offline"
  );

  light.classList.add(state);

  /*
   * Rebuild the row on every update so old placeholder
   * text cannot remain behind and create duplicate phrases.
   */
  row.replaceChildren(light);

  const messageText =
    document.createElement("span");

  messageText.className = "report-message";
  messageText.textContent = message;

  row.appendChild(messageText);
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


async function prepareMission() {

  const button =
    document.getElementById("homePrepareMission");

  if (button) {
    button.disabled = true;
    button.textContent = "SCANNING...";
  }

  try {

    await window.streamingMax.runPreflightCheck();

    await refreshHomeV3Mission();

    console.log("Mission refreshed.");

  } catch (err) {

    console.error(err);

  }

  if (button) {
    button.disabled = false;
    button.textContent = "PREPARE MISSION";
  }

}

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const button =
      document.getElementById("homePrepareMission");

    if (!button) return;

    button.onclick = prepareMission;

  }
);


/* ===== V2 My Studio Alpha ===== */

let v2StudioEquipmentIds = [];

function escapeStudioHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getV2StudioProfile() {
  const profile =
    await window.streamingMax.getProfile();

  return {
    ...profile,
    studioEquipment:
      Array.isArray(profile.studioEquipment)
        ? profile.studioEquipment
        : []
  };
}

function addHomeTimelineEvent(message) {
  const list =
    document.getElementById("homeTimelineList");

  if (!list) return;

  const article = document.createElement("article");
  const time = document.createElement("time");
  const text = document.createElement("p");

  time.textContent = "NOW";
  text.textContent = message;

  article.append(time, text);
  list.prepend(article);

  while (list.children.length > 4) {
    list.removeChild(list.lastElementChild);
  }
}

function announceV2StudioChange(message) {
  const observation =
    document.getElementById("homeAtlasObservation");

  if (observation) {
    observation.textContent = message;
  }

  addHomeTimelineEvent(message);
}

function renderV2EquipmentResults(devices = []) {
  const results =
    document.getElementById("v2EquipmentResults");

  const count =
    document.getElementById(
      "v2EquipmentResultCount"
    );

  if (!results) return;

  if (count) {
    count.textContent =
      `${devices.length} RESULT${devices.length === 1 ? "" : "S"}`;
  }

  if (!devices.length) {
    results.innerHTML = `
      <p class="studio-empty-v2">
        No matching equipment found.
      </p>
    `;
    return;
  }

  results.innerHTML = devices.map(device => {
    const alreadyAdded =
      v2StudioEquipmentIds.includes(device.id);

    const brand =
      escapeStudioHtml(
        device.brand ||
        device.manufacturer ||
        "Unknown Brand"
      );

    const name =
      escapeStudioHtml(
        device.name ||
        device.displayName ||
        "Unknown Device"
      );

    const category =
      escapeStudioHtml(
        device.subcategory ||
        device.category ||
        device.equipmentType ||
        "DJ Equipment"
      );

    const software =
      Array.isArray(device.software) &&
      device.software.length
        ? escapeStudioHtml(
            device.software.join(", ")
          )
        : "Software not listed";

    return `
      <article class="studio-equipment-card-v2">
        <div>
          <span class="studio-device-brand-v2">
            ${brand}
          </span>

          <h4>${name}</h4>

          <p>
            ${category} · ${software}
          </p>
        </div>

        <button
          type="button"
          data-v2-add-equipment="${escapeStudioHtml(device.id)}"
          ${alreadyAdded ? "disabled" : ""}
        >
          ${alreadyAdded ? "ADDED" : "ADD"}
        </button>
      </article>
    `;
  }).join("");

  results
    .querySelectorAll("[data-v2-add-equipment]")
    .forEach(button => {
      button.addEventListener("click", async () => {
        await addV2EquipmentToStudio(
          button.dataset.v2AddEquipment
        );
      });
    });
}

async function renderV2MyStudio() {
  const list =
    document.getElementById("v2MyStudioList");

  const count =
    document.getElementById("v2MyStudioCount");

  const headerCount =
    document.getElementById(
      "v2StudioDeviceCount"
    );

  if (!list) return;

  const profile = await getV2StudioProfile();

  v2StudioEquipmentIds =
    profile.studioEquipment;

  const total = v2StudioEquipmentIds.length;

  if (count) {
    count.textContent =
      `${total} ITEM${total === 1 ? "" : "S"}`;
  }

  if (headerCount) {
    headerCount.textContent =
      `${total} DEVICE${total === 1 ? "" : "S"}`;

    headerCount.classList.toggle(
      "healthy",
      total > 0
    );
  }

  if (!total) {
    list.innerHTML = `
      <p class="studio-empty-v2">
        No equipment added yet.
      </p>
    `;
    return;
  }

  const devices = (
    await Promise.all(
      v2StudioEquipmentIds.map(id =>
        window.streamingMax.getEquipmentById(id)
      )
    )
  ).filter(Boolean);

  list.innerHTML = devices.map(device => {
    const brand =
      escapeStudioHtml(
        device.brand ||
        device.manufacturer ||
        "Unknown Brand"
      );

    const name =
      escapeStudioHtml(
        device.name ||
        device.displayName ||
        "Unknown Device"
      );

    const category =
      escapeStudioHtml(
        device.subcategory ||
        device.category ||
        device.equipmentType ||
        "DJ Equipment"
      );

    const firmware =
      escapeStudioHtml(
        device.firmware?.installed ||
        "Firmware not entered"
      );

    return `
      <article class="my-studio-card-v2">
        <div>
          <span class="studio-device-brand-v2">
            ${brand}
          </span>

          <h4>${name}</h4>

          <p>
            ${category} · ${firmware}
          </p>
        </div>

        <button
          type="button"
          data-v2-remove-equipment="${escapeStudioHtml(device.id)}"
        >
          REMOVE
        </button>
      </article>
    `;
  }).join("");

  list
    .querySelectorAll("[data-v2-remove-equipment]")
    .forEach(button => {
      button.addEventListener("click", async () => {
        await removeV2EquipmentFromStudio(
          button.dataset.v2RemoveEquipment
        );
      });
    });
}

async function addV2EquipmentToStudio(deviceId) {
  try {
    const profile = await getV2StudioProfile();

    if (!profile.studioEquipment.includes(deviceId)) {
      profile.studioEquipment.push(deviceId);
    }

    await window.streamingMax.saveProfile(profile);
    await renderV2MyStudio();

    const device =
      await window.streamingMax.getEquipmentById(
        deviceId
      );

    announceV2StudioChange(
      `${device?.name || "Equipment"} was added to My Studio. I’ll include it in future mission checks.`
    );

    await searchV2StudioEquipment();
  } catch (error) {
    console.error(
      "V2 add equipment failed:",
      error
    );

    announceV2StudioChange(
      "I couldn’t save that equipment. Let’s try again."
    );
  }
}

async function removeV2EquipmentFromStudio(
  deviceId
) {
  try {
    const profile = await getV2StudioProfile();

    profile.studioEquipment =
      profile.studioEquipment.filter(
        id => id !== deviceId
      );

    await window.streamingMax.saveProfile(profile);

    const device =
      await window.streamingMax.getEquipmentById(
        deviceId
      );

    await renderV2MyStudio();

    announceV2StudioChange(
      `${device?.name || "Equipment"} was removed from My Studio.`
    );

    await searchV2StudioEquipment();
  } catch (error) {
    console.error(
      "V2 remove equipment failed:",
      error
    );

    announceV2StudioChange(
      "I couldn’t remove that equipment. Let’s try again."
    );
  }
}

async function searchV2StudioEquipment() {
  const input =
    document.getElementById(
      "v2EquipmentSearchInput"
    );

  if (!input) return;

  try {
    const devices =
      await window.streamingMax.searchEquipment(
        input.value.trim()
      );

    renderV2EquipmentResults(devices);
  } catch (error) {
    console.error(
      "V2 equipment search failed:",
      error
    );

    const results =
      document.getElementById(
        "v2EquipmentResults"
      );

    if (results) {
      results.innerHTML = `
        <p class="studio-empty-v2">
          Equipment search could not be completed.
        </p>
      `;
    }
  }
}

async function initializeV2StudioBuilder() {
  const searchButton =
    document.getElementById(
      "v2EquipmentSearchBtn"
    );

  const searchInput =
    document.getElementById(
      "v2EquipmentSearchInput"
    );

  if (searchButton) {
    searchButton.addEventListener(
      "click",
      searchV2StudioEquipment
    );
  }

  if (searchInput) {
    searchInput.addEventListener(
      "keydown",
      event => {
        if (event.key === "Enter") {
          event.preventDefault();
          searchV2StudioEquipment();
        }
      }
    );
  }

  await renderV2MyStudio();
}

document.addEventListener(
  "DOMContentLoaded",
  initializeV2StudioBuilder
);

/* ===== ATLAS Chat Alpha ===== */

function addV2AtlasMessage(role, message) {
  const conversation =
    document.getElementById(
      "v2AtlasConversation"
    );

  if (!conversation) return;

  const wrapper =
    document.createElement("div");

  wrapper.className =
    role === "commander"
      ? "commander-message"
      : "atlas-message";

  const label =
    document.createElement("span");

  label.textContent =
    role === "commander"
      ? "COMMANDER"
      : "ATLAS";

  const body =
    document.createElement("p");

  body.textContent = message;

  wrapper.append(label, body);
  conversation.appendChild(wrapper);

  conversation.scrollTop =
    conversation.scrollHeight;
}

async function runV2AtlasAction(action) {
  if (!action) return;

  if (action === "launch-obs") {
    await window.streamingMax.launchStudioApp(
      "obs"
    );

    setTimeout(refreshHomeV3Mission, 1500);
    return;
  }

  if (action === "launch-rekordbox") {
    await window.streamingMax.launchStudioApp(
      "rekordbox"
    );

    setTimeout(refreshHomeV3Mission, 1500);
    return;
  }

  if (action === "run-speed-test") {
    addV2AtlasMessage(
      "atlas",
      "Running the speed test now. This may take a moment."
    );

    const result =
      await window.streamingMax.runSpeedTest();

    addV2AtlasMessage(
      "atlas",
      result?.success === false
        ? result.message || "The speed test could not be completed."
        : `Speed test complete. Download: ${result?.downloadMbps ?? "--"} Mbps. Upload: ${result?.uploadMbps ?? "--"} Mbps. Latency: ${result?.latencyMs ?? "--"} ms.`
    );

    return;
  }

  if (action === "prepare-mission") {
    await prepareMission();

    addV2AtlasMessage(
      "atlas",
      "Mission scan complete. The Home briefing has been refreshed."
    );

    return;
  }

  if (action === "open-studio") {
    const tab =
      document.querySelector(
        '[data-department="studio"]'
      );

    tab?.click();
  }
}

async function sendV2AtlasMessage(message) {
  const cleanMessage =
    String(message || "").trim();

  if (!cleanMessage) return;

  addV2AtlasMessage(
    "commander",
    cleanMessage
  );

  try {
    const response =
      await window.streamingMax.atlasChat(
        cleanMessage
      );

    addV2AtlasMessage(
      "atlas",
      response?.reply ||
        "I couldn’t build a response."
    );

    await runV2AtlasAction(
      response?.action
    );
  } catch (error) {
    console.error(
      "ATLAS Chat failed:",
      error
    );

    addV2AtlasMessage(
      "atlas",
      "I hit a communication problem. Mission Control is still running, but chat needs another check."
    );
  }
}

async function initializeV2AtlasChat() {
  const form =
    document.getElementById(
      "v2AtlasComposer"
    );

  const input =
    document.getElementById(
      "v2AtlasInput"
    );

  const humorSelect =
    document.getElementById(
      "v2AtlasHumor"
    );

  if (!form || !input) return;

  try {
    const profile =
      await window.streamingMax.getProfile();

    if (humorSelect) {
      humorSelect.value =
        profile.atlasHumor || "friendly";
    }
  } catch (error) {
    console.error(
      "ATLAS profile load failed:",
      error
    );
  }

  form.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const message = input.value;
      input.value = "";

      await sendV2AtlasMessage(message);
      input.focus();
    }
  );

  humorSelect?.addEventListener(
    "change",
    async () => {
      const profile =
        await window.streamingMax.getProfile();

      profile.atlasHumor =
        humorSelect.value;

      await window.streamingMax.saveProfile(
        profile
      );

      const labels = {
        professional:
          "Professional mode enabled.",
        friendly:
          "Friendly mode enabled.",
        full:
          "Full ATLAS enabled. You brought this on yourself."
      };

      addV2AtlasMessage(
        "atlas",
        labels[humorSelect.value]
      );
    }
  );
}

document.addEventListener(
  "DOMContentLoaded",
  initializeV2AtlasChat
);

/* ===== Home Quick Launch Actions ===== */

async function runHomeQuickAction(action, button) {
  if (!action) return;

  const originalLabel = button?.innerHTML;

  try {
    if (button) {
      button.disabled = true;
      button.classList.add("working");
    }

    if (action === "obs") {
      if (button) {
        button.innerHTML =
          "<span>OBS</span><small>OPENING...</small>";
      }

      const result =
        await window.streamingMax.launchStudioApp("obs");

      addHomeTimelineEvent(
        result?.success
          ? "ATLAS requested OBS Studio launch."
          : result?.message || "OBS could not be opened."
      );
    }

    if (action === "rekordbox") {
      if (button) {
        button.innerHTML =
          "<span>REKORDBOX</span><small>OPENING...</small>";
      }

      const result =
        await window.streamingMax.launchStudioApp(
          "rekordbox"
        );

      addHomeTimelineEvent(
        result?.success
          ? "ATLAS requested Rekordbox launch."
          : result?.message ||
            "Rekordbox could not be opened."
      );
    }

    /*
     * Give macOS a moment to launch the application,
     * then refresh the Home status lights.
     */
    setTimeout(
      refreshHomeV3Mission,
      1800
    );
  } catch (error) {
    console.error(
      "Home quick action failed:",
      error
    );

    addHomeTimelineEvent(
      `Quick launch error: ${error.message}`
    );
  } finally {
    setTimeout(() => {
      if (!button) return;

      button.disabled = false;
      button.classList.remove("working");

      if (originalLabel) {
        button.innerHTML = originalLabel;
      }
    }, 1200);
  }
}

function initializeHomeQuickActions() {
  document
    .querySelectorAll("[data-quick-action]")
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          runHomeQuickAction(
            button.dataset.quickAction,
            button
          );
        }
      );
    });
}

document.addEventListener(
  "DOMContentLoaded",
  initializeHomeQuickActions
);

/* =========================================================
   STUDIO SOFTWARE RACK
   ========================================================= */

let v2SoftwareRackTimer = null;

function setV2SoftwareCard(
  cardId,
  statusId,
  isRunning
) {
  const card = document.getElementById(cardId);
  const status =
    document.getElementById(statusId);

  if (!card || !status) return;

  card.classList.remove(
    "checking",
    "online",
    "offline"
  );

  card.classList.add(
    isRunning ? "online" : "offline"
  );

  status.textContent =
    isRunning ? "RUNNING" : "CLOSED";
}

async function refreshV2SoftwareRack() {
  const onlineCount =
    document.getElementById(
      "v2SoftwareOnlineCount"
    );

  try {
    const studio =
      await window.streamingMax.detectStudio();

    const obsRunning = Boolean(studio.obs);
    const rekordboxRunning =
      Boolean(studio.rekordbox);

    setV2SoftwareCard(
      "v2ObsSoftwareCard",
      "v2ObsSoftwareStatus",
      obsRunning
    );

    setV2SoftwareCard(
      "v2RekordboxSoftwareCard",
      "v2RekordboxSoftwareStatus",
      rekordboxRunning
    );

    const totalOnline =
      Number(obsRunning) +
      Number(rekordboxRunning);

    if (onlineCount) {
      onlineCount.textContent =
        `${totalOnline}/2 ONLINE`;
    }
  } catch (error) {
    console.error(
      "Software Rack refresh failed:",
      error
    );

    if (onlineCount) {
      onlineCount.textContent =
        "STATUS UNAVAILABLE";
    }
  }
}

async function launchV2StudioSoftware(
  appName,
  button
) {
  const originalText =
    button.textContent;

  button.disabled = true;
  button.textContent = "OPENING...";

  try {
    const result =
      await window.streamingMax.launchStudioApp(
        appName
      );

    addHomeTimelineEvent(
      result?.message ||
      `${appName} launch requested.`
    );

    /*
     * Let macOS finish opening the app,
     * then update both Studio and Home.
     */
    setTimeout(async () => {
      await refreshV2SoftwareRack();
      await refreshHomeV3Mission();
    }, 1800);
  } catch (error) {
    console.error(
      "Studio software launch failed:",
      error
    );

    addHomeTimelineEvent(
      `Could not open ${appName}: ${error.message}`
    );
  } finally {
    setTimeout(() => {
      button.disabled = false;
      button.textContent = originalText;
    }, 1200);
  }
}

function initializeV2SoftwareRack() {
  document
    .querySelectorAll(
      "[data-software-launch]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          launchV2StudioSoftware(
            button.dataset.softwareLaunch,
            button
          );
        }
      );
    });

  refreshV2SoftwareRack();

  if (v2SoftwareRackTimer) {
    clearInterval(v2SoftwareRackTimer);
  }

  v2SoftwareRackTimer = setInterval(
    refreshV2SoftwareRack,
    5000
  );
}

document.addEventListener(
  "DOMContentLoaded",
  initializeV2SoftwareRack
);

/* =========================================================
   HOME MAIN MISSION ACTIONS
   ========================================================= */

function setHomeActionStatus(message) {
  const status =
    document.getElementById("homeActionStatus");

  if (status) {
    status.textContent = message;
  }
}

async function launchHomeMainApp(
  appName,
  button
) {
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "OPENING...";

  try {
    const result =
      await window.streamingMax.launchStudioApp(
        appName
      );

    const displayName =
      appName === "obs"
        ? "OBS"
        : "Rekordbox";

    setHomeActionStatus(
      result?.success
        ? `${displayName} launch requested.`
        : result?.message ||
          `${displayName} could not be opened.`
    );

    addHomeTimelineEvent(
      result?.success
        ? `${displayName} launch requested.`
        : `${displayName} launch failed.`
    );

    setTimeout(async () => {
      await refreshHomeV3Mission();

      if (
        typeof refreshV2SoftwareRack ===
        "function"
      ) {
        await refreshV2SoftwareRack();
      }
    }, 1800);
  } catch (error) {
    console.error(
      "Main application launch failed:",
      error
    );

    setHomeActionStatus(
      `Launch error: ${error.message}`
    );
  } finally {
    setTimeout(() => {
      button.disabled = false;
      button.textContent = originalText;
    }, 1200);
  }
}

async function runHomeCleanMode(button) {
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "CLEANING...";
  setHomeActionStatus(
    "ATLAS is cleaning temporary files."
  );

  try {
    const result =
      await window.streamingMax.runMode(
        "Clean Mode"
      );

    const messages =
      Array.isArray(result?.messages)
        ? result.messages
        : [];

    const recoveredMessage =
      messages.find(message =>
        message.includes(
          "Estimated recovered space"
        )
      );

    setHomeActionStatus(
      recoveredMessage ||
      "Clean Mode completed."
    );

    addHomeTimelineEvent(
      recoveredMessage ||
      "Clean Mode completed successfully."
    );

    await refreshHomeV3Mission();
  } catch (error) {
    console.error(
      "Clean Mode failed:",
      error
    );

    setHomeActionStatus(
      `Clean Mode error: ${error.message}`
    );

    addHomeTimelineEvent(
      `Clean Mode error: ${error.message}`
    );
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function runHomeSpeedTest(button) {
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "TESTING...";
  setHomeActionStatus(
    "ATLAS is testing the connection."
  );

  try {
    const result =
      await window.streamingMax.runSpeedTest();

    if (result?.success === false) {
      setHomeActionStatus(
        result.message ||
        "Speed test could not be completed."
      );

      return;
    }

    const download =
      result?.downloadMbps ?? "--";

    const upload =
      result?.uploadMbps ?? "--";

    const latency =
      result?.latencyMs ?? "--";

    const summary =
      `Speed test: ${download} Mbps down, ${upload} Mbps up, ${latency} ms latency.`;

    setHomeActionStatus(summary);
    addHomeTimelineEvent(summary);

    await refreshHomeV3Mission();
  } catch (error) {
    console.error(
      "Home speed test failed:",
      error
    );

    setHomeActionStatus(
      `Speed test error: ${error.message}`
    );
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function initializeHomeMainActions() {
  document
    .querySelectorAll("[data-main-launch]")
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          launchHomeMainApp(
            button.dataset.mainLaunch,
            button
          );
        }
      );
    });

  const cleanButton =
    document.getElementById(
      "homeCleanButton"
    );

  cleanButton?.addEventListener(
    "click",
    () => runHomeCleanMode(cleanButton)
  );

  const speedButton =
    document.getElementById(
      "homeSpeedTestButton"
    );

  speedButton?.addEventListener(
    "click",
    () => runHomeSpeedTest(speedButton)
  );
}

document.addEventListener(
  "DOMContentLoaded",
  initializeHomeMainActions
);

/* =========================================================
   LIVE PERFORMANCE DEPARTMENT
   ========================================================= */

let performanceRefreshTimer = null;

function setPerformanceText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function updatePerformanceAssessment(stats) {
  const score = Number(stats.performanceScore || 0);

  let title = "System performance needs attention.";
  let message =
    "ATLAS recommends reducing the current system workload.";

  if (score >= 90) {
    title = "Your system is performing strongly.";
    message =
      "CPU, memory, and storage conditions are suitable for the current mission.";
  } else if (score >= 75) {
    title = "Performance is acceptable.";
    message =
      "Streaming should be possible, but ATLAS recommends watching the current workload.";
  }

  if (Array.isArray(stats.warnings) &&
      stats.warnings.length) {
    message = stats.warnings.join(" ");
  } else if (
    Array.isArray(stats.recommendations) &&
    stats.recommendations.length
  ) {
    message = stats.recommendations.join(" ");
  }

  setPerformanceText(
    "performanceAssessmentTitle",
    title
  );

  setPerformanceText(
    "performanceAssessmentMessage",
    message
  );
}

function updatePerformanceDepartmentStatus(stats) {
  const badge =
    document.getElementById(
      "performanceDepartmentStatus"
    );

  if (!badge) return;

  const score = Number(stats.performanceScore || 0);

  badge.classList.remove(
    "healthy",
    "checking",
    "warning"
  );

  if (score >= 85) {
    badge.classList.add("healthy");
    badge.textContent = "HEALTHY";
  } else if (score >= 70) {
    badge.classList.add("warning");
    badge.textContent = "WATCH";
  } else {
    badge.classList.add("warning");
    badge.textContent = "ATTENTION";
  }
}

function renderPerformanceProcesses(processes = []) {
  const list =
    document.getElementById(
      "performanceProcessList"
    );

  if (!list) return;

  if (!processes.length) {
    list.innerHTML = `
      <p class="performance-empty">
        No process information is available.
      </p>
    `;
    return;
  }

  list.innerHTML = processes
    .slice(0, 10)
    .map(process => `
      <article class="performance-process-row">
        <div>
          <h4>${escapeStudioHtml(process.name || "Unknown")}</h4>
          <p>PID ${escapeStudioHtml(process.pid || "--")}</p>
        </div>

        <div class="performance-process-stat">
          <small>CPU</small>
          <strong>${Number(process.cpu || 0).toFixed(1)}%</strong>
        </div>

        <div class="performance-process-stat">
          <small>MEMORY</small>
          <strong>${Number(process.ramMB || 0)} MB</strong>
        </div>

        <button
          class="performance-end-process"
          type="button"
          data-end-process="${escapeStudioHtml(process.pid)}"
          data-process-name="${escapeStudioHtml(process.name || "Unknown")}"
        >
          END
        </button>
      </article>
    `)
    .join("");

  list
    .querySelectorAll("[data-end-process]")
    .forEach(button => {
      button.addEventListener(
        "click",
        async () => {
          const pid =
            Number(button.dataset.endProcess);

          const processName =
            button.dataset.processName ||
            "this process";

          const confirmed = window.confirm(
            `End ${processName}?\n\nUnsaved work in that application may be lost.`
          );

          if (!confirmed) return;

          const originalText =
            button.textContent;

          button.disabled = true;
          button.textContent = "ENDING...";

          try {
            const result =
              await window.streamingMax.endProcess(
                pid
              );

            addHomeTimelineEvent(
              result?.message ||
              `${processName} process action completed.`
            );

            if (!result?.success) {
              window.alert(
                result?.message ||
                "The process could not be ended."
              );
            }

            setTimeout(
              refreshPerformanceDepartment,
              700
            );
          } catch (error) {
            console.error(
              "End process failed:",
              error
            );

            window.alert(
              `Could not end ${processName}: ${error.message}`
            );
          } finally {
            button.disabled = false;
            button.textContent = originalText;
          }
        }
      );
    });
}

async function refreshPerformanceDepartment() {
  const refreshButton =
    document.getElementById(
      "performanceRefreshButton"
    );

  try {
    const [stats, processes] =
      await Promise.all([
        window.streamingMax.getLiveStats(),
        window.streamingMax.getTopProcesses()
      ]);

    setPerformanceText(
      "performanceCpuValue",
      `${stats.cpuPercent}%`
    );

    setPerformanceText(
      "performanceMemoryValue",
      `${stats.ramPercent}%`
    );

    setPerformanceText(
      "performanceStorageValue",
      `${stats.diskPercent}%`
    );

    setPerformanceText(
      "performanceScoreValue",
      `${stats.performanceScore}/100`
    );

    setPerformanceText(
      "performanceGradeValue",
      stats.performanceGrade || "--"
    );

    setPerformanceText(
      "performanceRiskValue",
      stats.droppedFrameRisk || "UNKNOWN"
    );

    setPerformanceText(
      "performanceMemoryPercent",
      `${stats.ramPercent}%`
    );

    setPerformanceText(
      "performanceFreeMemory",
      `${stats.freeMemoryGB} GB`
    );

    setPerformanceText(
      "performanceTotalMemory",
      `${stats.totalMemoryGB} GB`
    );

    setPerformanceText(
      "performanceDiskPercent",
      `${stats.diskPercent}%`
    );

    setPerformanceText(
      "performanceDiskStatus",
      stats.diskPercent >= 90
        ? "LOW SPACE"
        : stats.diskPercent >= 75
          ? "WATCH"
          : "HEALTHY"
    );

    updatePerformanceAssessment(stats);
    updatePerformanceDepartmentStatus(stats);
    renderPerformanceProcesses(processes);
  } catch (error) {
    console.error(
      "Performance refresh failed:",
      error
    );

    const badge =
      document.getElementById(
        "performanceDepartmentStatus"
      );

    if (badge) {
      badge.textContent = "UNAVAILABLE";
    }
  } finally {
    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.textContent = "REFRESH";
    }
  }
}

function initializePerformanceDepartment() {
  document
    .querySelectorAll("[data-performance-tab]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const selected =
          button.dataset.performanceTab;

        document
          .querySelectorAll("[data-performance-tab]")
          .forEach(tab => {
            tab.classList.toggle(
              "active",
              tab === button
            );
          });

        document
          .querySelectorAll("[data-performance-view]")
          .forEach(view => {
            view.classList.toggle(
              "active",
              view.dataset.performanceView ===
                selected
            );
          });
      });
    });

  const refreshButton =
    document.getElementById(
      "performanceRefreshButton"
    );

  refreshButton?.addEventListener(
    "click",
    async () => {
      refreshButton.disabled = true;
      refreshButton.textContent = "REFRESHING...";

      await refreshPerformanceDepartment();
    }
  );

  refreshPerformanceDepartment();

  if (performanceRefreshTimer) {
    clearInterval(performanceRefreshTimer);
  }

  performanceRefreshTimer = setInterval(
    refreshPerformanceDepartment,
    5000
  );
}

document.addEventListener(
  "DOMContentLoaded",
  initializePerformanceDepartment
);
