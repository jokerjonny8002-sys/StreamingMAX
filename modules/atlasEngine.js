function buildAtlasMessage(stats, studio, readiness, displayName = "Streamer") {
  const advice = [];
  let state = "READY";

  if (stats.cpuPercent >= 85) {
    state = "DANGER";
    advice.push(`CPU usage is critical at ${stats.cpuPercent}%.`);
    advice.push("Close unnecessary applications before streaming.");
  } else if (stats.cpuPercent >= 70) {
    state = "WARNING";
    advice.push(`CPU usage is elevated at ${stats.cpuPercent}%.`);
  }

  if (stats.ramPercent >= 85) {
    state = state === "DANGER" ? state : "WARNING";
    advice.push(`Active RAM usage is high at ${stats.ramPercent}%.`);
  }

  if (!studio.obs) {
    state = state === "DANGER" ? state : "WARNING";
    advice.push("OBS is not running.");
  }

  if (!studio.rekordbox) {
    advice.push("Rekordbox is not running.");
  }

  if (stats.networkHealth === "Fair" || stats.networkHealth === "Poor") {
    state = state === "DANGER" ? state : "WARNING";
    advice.push(`Network health is ${stats.networkHealth.toLowerCase()}.`);
  }

  if (!stats.sleepPreventionActive) {
    advice.push("Sleep Guard is not active.");
  }

  if (advice.length === 0) {
    advice.push("No critical issues detected.");
    advice.push("Recommend proceeding with livestream.");
  }

  const summary = readiness.ready
    ? `Mission status is ready with a Stream Score of ${readiness.score}/100.`
    : `Mission status needs attention. Stream Score is ${readiness.score}/100.`;

  return {
    greeting: `Good evening, ${displayName}.`,
    summary,
    advice,
    state,
    bitrateRecommendation: stats.bitrateRecommendation
  };
}

module.exports = {
  buildAtlasMessage
};
