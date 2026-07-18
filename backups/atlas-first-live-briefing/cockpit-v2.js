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
