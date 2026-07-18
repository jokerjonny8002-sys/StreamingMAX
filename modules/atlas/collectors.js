const missionState = require("./missionState");

function normalizeText(value, fallback = "checking") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  return normalized || fallback;
}

function getPerformanceStatus(stats) {
  const score = Number(stats.performanceScore);

  if (!Number.isFinite(score)) {
    return "checking";
  }

  if (score >= 85) {
    return "healthy";
  }

  if (score >= 70) {
    return "warning";
  }

  return "attention";
}

function getMissionImpact(stats) {
  const score = Number(stats.performanceScore);

  if (!Number.isFinite(score)) {
    return "checking";
  }

  if (score >= 90) {
    return "excellent";
  }

  if (score >= 80) {
    return "good";
  }

  if (score >= 70) {
    return "needs review";
  }

  return "attention needed";
}

function getNetworkStatus(networkHealth) {
  const health = normalizeText(networkHealth);

  if (health === "excellent" || health === "good") {
    return "ready";
  }

  if (health === "fair") {
    return "warning";
  }

  /*
   * The performance engine currently returns "Idle" when
   * instantaneous network traffic is below 1 Mbps.
   *
   * That does not prove the internet is offline, so ATLAS
   * treats it as checking until a real connectivity or speed
   * test is available.
   */
  if (health === "idle" || health === "checking") {
    return "checking";
  }

  if (
    health === "offline" ||
    health === "poor" ||
    health === "disconnected"
  ) {
    return "offline";
  }

  return "checking";
}

function getStudioStatus(studio) {
  if (studio.ready) {
    return "ready";
  }

  if (studio.obs || studio.rekordbox) {
    return "partial";
  }

  return "standby";
}

function getPrimaryIssue(readiness) {
  if (
    Array.isArray(readiness.fixes) &&
    readiness.fixes.length > 0
  ) {
    return readiness.fixes[0];
  }

  return null;
}

function collectMissionState({
  stats = {},
  studio = {},
  readiness = {}
} = {}) {
  missionState.updateSection("performance", {
    status: getPerformanceStatus(stats),
    cpuPercent:
      Number.isFinite(Number(stats.cpuPercent))
        ? Number(stats.cpuPercent)
        : null,
    memoryPercent:
      Number.isFinite(Number(stats.ramPercent))
        ? Number(stats.ramPercent)
        : null,
    storagePercent:
      Number.isFinite(Number(stats.diskPercent))
        ? Number(stats.diskPercent)
        : null,
    temperatureF:
      Number.isFinite(Number(stats.cpuTemperatureF))
        ? Number(stats.cpuTemperatureF)
        : null,
    missionImpact: getMissionImpact(stats)
  });

  missionState.updateSection("network", {
    status: getNetworkStatus(stats.networkHealth),
    downloadMbps:
      Number.isFinite(Number(stats.downloadMbps))
        ? Number(stats.downloadMbps)
        : null,
    uploadMbps:
      Number.isFinite(Number(stats.uploadMbps))
        ? Number(stats.uploadMbps)
        : null,
    latencyMs:
      Number.isFinite(Number(stats.latencyMs))
        ? Number(stats.latencyMs)
        : null,
    packetLossPercent:
      Number.isFinite(Number(stats.packetLossPercent))
        ? Number(stats.packetLossPercent)
        : null
  });

  missionState.updateSection("studio", {
    status: getStudioStatus(studio),
    obsRunning: Boolean(studio.obs),
    rekordboxRunning: Boolean(studio.rekordbox),
    rx3Connected:
      typeof studio.rx3 === "boolean"
        ? studio.rx3
        : null,
    cameraConnected:
      typeof studio.camera === "boolean"
        ? studio.camera
        : null,
    audioInterfaceConnected:
      typeof studio.focusrite === "boolean"
        ? studio.focusrite
        : null
  });

  missionState.updateSection("safeguards", {
    sleepGuardActive:
      Boolean(stats.sleepPreventionActive)
  });

  missionState.updateSection("mission", {
    readinessScore:
      Number.isFinite(Number(readiness.score))
        ? Number(readiness.score)
        : 0,
    status: normalizeText(
      readiness.status,
      "checking"
    ),
    primaryIssue: getPrimaryIssue(readiness)
  });

  return missionState.getState();
}

module.exports = {
  collectMissionState,
  getNetworkStatus,
  getPerformanceStatus,
  getMissionImpact,
  getStudioStatus
};
