function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function createRecommendation({
  priority,
  category,
  headline,
  message,
  action,
  actionType = null,
  confidence = "high"
}) {
  return {
    priority,
    category,
    headline,
    message,
    action,
    actionType,
    confidence
  };
}

function getRecommendation(state = {}) {
  const performance = state.performance || {};
  const network = state.network || {};
  const studio = state.studio || {};
  const safeguards = state.safeguards || {};
  const mission = state.mission || {};

  const performanceStatus =
    normalizeStatus(performance.status);

  const networkStatus =
    normalizeStatus(network.status);

  const studioStatus =
    normalizeStatus(studio.status);

  const missionStatus =
    normalizeStatus(mission.status);

  /*
   * Highest-priority problems come first.
   * ATLAS gives one clear recommendation,
   * not a wall of competing alerts.
   */

  if (networkStatus === "offline") {
    return createRecommendation({
      priority: "critical",
      category: "network",
      headline: "Your internet connection needs attention.",
      message:
        "I would check the connection before trying to go live. Everything else can wait until we know the network is stable.",
      action: "Review Network",
      actionType: "open-network"
    });
  }

  if (performanceStatus === "attention") {
    return createRecommendation({
      priority: "critical",
      category: "performance",
      headline: "Your computer is under heavier load than I would like.",
      message:
        "Let’s review CPU and memory usage before opening anything else.",
      action: "Review Performance",
      actionType: "open-performance"
    });
  }

  if (networkStatus === "warning") {
    return createRecommendation({
      priority: "warning",
      category: "network",
      headline: "Your connection could use a closer look.",
      message:
        "It may still be usable, but I would run a speed test before starting the stream.",
      action: "Run Speed Test",
      actionType: "run-speed-test"
    });
  }

  if (performanceStatus === "warning") {
    return createRecommendation({
      priority: "warning",
      category: "performance",
      headline: "Performance is a little tighter than usual.",
      message:
        "Nothing is falling apart, but I would avoid opening unnecessary apps before the mission.",
      action: "Review Performance",
      actionType: "open-performance"
    });
  }

  if (!studio.obsRunning) {
    return createRecommendation({
      priority: "recommendation",
      category: "studio",
      headline: "OBS is not running yet.",
      message:
        "Your system looks capable. I would open OBS before preparing the rest of the stream.",
      action: "Open OBS",
      actionType: "launch-obs"
    });
  }

  if (!studio.rekordboxRunning) {
    return createRecommendation({
      priority: "recommendation",
      category: "studio",
      headline: "Rekordbox is the next logical step.",
      message:
        "OBS is available and the important systems look stable. Let’s get your DJ software online.",
      action: "Open Rekordbox",
      actionType: "launch-rekordbox"
    });
  }

  if (!safeguards.sleepGuardActive) {
    return createRecommendation({
      priority: "recommendation",
      category: "safeguards",
      headline: "I would enable Sleep Guard before we begin.",
      message:
        "That keeps the computer from going to sleep during a live session.",
      action: "Enable Sleep Guard",
      actionType: "enable-sleep-guard"
    });
  }

  if (
    networkStatus === "checking" &&
    studioStatus === "ready"
  ) {
    return createRecommendation({
      priority: "checking",
      category: "network",
      headline: "Your studio is ready while I finish checking the connection.",
      message:
        "The low traffic reading does not mean your internet is offline. A speed test will give us a real answer.",
      action: "Run Speed Test",
      actionType: "run-speed-test",
      confidence: "medium"
    });
  }

  if (
    missionStatus === "system ready" ||
    Number(mission.readinessScore) >= 85
  ) {
    return createRecommendation({
      priority: "ready",
      category: "mission",
      headline: "Everything important looks ready.",
      message:
        "OBS and Rekordbox are online, performance is healthy, and I do not see an immediate reason to hold the mission.",
      action: "Prepare Mission",
      actionType: "prepare-mission"
    });
  }

  if (mission.primaryIssue) {
    return createRecommendation({
      priority: "recommendation",
      category: "mission",
      headline: "I found one thing worth handling first.",
      message: String(mission.primaryIssue),
      action: "Review Mission",
      actionType: "review-mission"
    });
  }

  return createRecommendation({
    priority: "checking",
    category: "mission",
    headline: "I’m still reviewing the important systems.",
    message:
      "Give me a moment to collect enough information for a useful recommendation.",
    action: "Continue Checking",
    actionType: null,
    confidence: "medium"
  });
}

module.exports = {
  getRecommendation
};
