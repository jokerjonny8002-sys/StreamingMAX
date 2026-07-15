function buildPreflight(stats) {
  return [
    {
      id: "cpu",
      ok: stats.cpuPercent < 80,
      text: stats.cpuPercent < 80
        ? `${stats.cpuPercent}% · PASS`
        : `${stats.cpuPercent}% · HIGH`
    },
    {
      id: "ram",
      ok: stats.ramPercent < 80,
      text: stats.ramPercent < 80
        ? `${stats.ramPercent}% · PASS`
        : `${stats.ramPercent}% · HIGH`
    },
    {
      id: "disk",
      ok: stats.diskPercent < 90,
      text: stats.diskPercent < 90
        ? `${stats.diskPercent}% · PASS`
        : `${stats.diskPercent}% · FULL`
    },
    {
      id: "obs",
      ok: Boolean(stats.obsRunning),
      text: stats.obsRunning ? "CONNECTED" : "OFFLINE"
    },
    {
      id: "rekordbox",
      ok: Boolean(stats.rekordboxRunning),
      text: stats.rekordboxRunning ? "CONNECTED" : "OFFLINE"
    },
    {
      id: "network",
      ok: stats.networkHealth !== "Poor",
      text:
  stats.networkHealth === "Idle"
    ? "CONNECTED"
    : String(stats.networkHealth || "UNKNOWN").toUpperCase()
    },
    {
      id: "sleep",
      ok: Boolean(stats.sleepPreventionActive),
      text: stats.sleepPreventionActive ? "ACTIVE" : "OFF"
    }
  ];
}

module.exports = {
  buildPreflight
};
