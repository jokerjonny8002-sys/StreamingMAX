function calculateReadiness(stats, studio) {
  const checks = [
    {
      id: "cpu",
      label: "CPU below 70%",
      points: 10,
      passed: stats.cpuPercent < 70,
      fix: "Reduce CPU usage for +10 points."
    },
    {
      id: "ram",
      label: "RAM below 80%",
      points: 10,
      passed: stats.ramPercent < 80,
      fix: "Close memory-heavy apps for +10 points."
    },
    {
      id: "disk",
      label: "Disk usage below 90%",
      points: 10,
      passed: stats.diskPercent < 90,
      fix: "Free disk space for +10 points."
    },
    {
      id: "obs",
      label: "OBS running",
      points: 15,
      passed: Boolean(studio.obs),
      fix: "Open OBS for +15 points."
    },
    {
      id: "rekordbox",
      label: "Rekordbox running",
      points: 15,
      passed: Boolean(studio.rekordbox),
      fix: "Open Rekordbox for +15 points."
    },
    {
      id: "network",
      label: "Network healthy",
      points: 15,
      passed: !["Fair", "Idle"].includes(stats.networkHealth),
      fix: "Improve network conditions for +15 points."
    },
    {
      id: "sleep",
      label: "Sleep Guard active",
      points: 5,
      passed: Boolean(stats.sleepPreventionActive),
      fix: "Enable DJ or Stream Mode for +5 points."
    },

    // Hardware detection is not connected yet, so these do not
    // reduce the score until real detection is implemented.
    {
      id: "audio",
      label: "Audio interface detected",
      points: 10,
      passed: true,
      pending: true,
      fix: ""
    },
    {
      id: "camera",
      label: "Camera detected",
      points: 10,
      passed: true,
      pending: true,
      fix: ""
    }
  ];

  const score = checks.reduce(
    (total, check) => total + (check.passed ? check.points : 0),
    0
  );

  const fixes = checks
    .filter(check => !check.passed && check.fix)
    .map(check => check.fix);

  let grade = "F";

  if (score >= 95) grade = "A+";
  else if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";

  return {
    score,
    grade,
    ready: score >= 85,
    status:
      score >= 85
        ? "SYSTEM READY"
        : score >= 70
          ? "NEEDS ATTENTION"
          : "NOT READY",
    checks,
    fixes
  };
}

module.exports = {
  calculateReadiness
};
