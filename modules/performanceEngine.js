function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function gradeFromScore(score) {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function calculatePerformance(stats) {
  let score = 100;
  const warnings = [];
  const recommendations = [];

  if (stats.cpuPercent > 85) {
    score -= 30;
    warnings.push("CPU usage is very high.");
    recommendations.push("Close heavy background apps before streaming.");
  } else if (stats.cpuPercent > 65) {
    score -= 15;
    warnings.push("CPU usage is elevated.");
  }

  if (stats.ramPercent > 85) {
    score -= 20;
    warnings.push("Memory usage is very high.");
    recommendations.push("Restart or close unused apps.");
  } else if (stats.ramPercent > 70) {
    score -= 10;
  }

  if (stats.diskPercent > 90) {
    score -= 10;
    warnings.push("Disk space is getting tight.");
    recommendations.push("Run Clean Mode or clear large files.");
  }

  if (!stats.obsRunning) {
    score -= 5;
    recommendations.push("Open OBS before streaming.");
  }

  if (!stats.rekordboxRunning) {
    score -= 5;
    recommendations.push("Open Rekordbox before DJ Mode.");
  }

  const upload = stats.uploadMbps || 0;
  let bitrateRecommendation = 8000;
  let networkHealth = "Excellent";

  if (upload < 1) {
    networkHealth = "Idle";
  } else if (upload < 4) {
    networkHealth = "Fair";
    bitrateRecommendation = 3000;
  } else if (upload < 8) {
    networkHealth = "Good";
    bitrateRecommendation = 6000;
  }

  score = clamp(Math.round(score), 0, 100);

  return {
    score,
    grade: gradeFromScore(score),
    streamReady: score >= 85,
    droppedFrameRisk: score >= 85 ? "LOW" : score >= 70 ? "MEDIUM" : "HIGH",
    networkHealth,
    bitrateRecommendation,
    warnings,
    recommendations
  };
}

module.exports = {
  calculatePerformance
};
