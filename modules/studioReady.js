function buildStudioReady(stats, studio, processes) {
  const checks = [
    { name: "OBS", ok: Boolean(studio.obs), fix: "Open OBS before streaming." },
    { name: "Rekordbox", ok: Boolean(studio.rekordbox), fix: "Open Rekordbox before DJ Mode." },
    { name: "CPU", ok: stats.cpuPercent < 75, fix: "Close high CPU apps." },
    { name: "RAM", ok: stats.ramPercent < 85, fix: "Close high memory apps." },
    { name: "Disk", ok: stats.diskPercent < 90, fix: "Run Clean Mode or clear large files." },
    { name: "Network", ok: stats.networkHealth !== "Fair", fix: "Lower OBS bitrate or use Ethernet." }
  ];

  const failed = checks.filter(c => !c.ok);
  const topMemory = processes?.[0];

  if (topMemory && topMemory.ramMB > 1000) {
    failed.push({
      name: "Memory Hog",
      ok: false,
      fix: `${topMemory.name} is using ${topMemory.ramMB} MB RAM.`
    });
  }

  return {
    ready: failed.length === 0,
    status: failed.length === 0 ? "🟢 Studio Ready" : "🟡 Studio Needs Attention",
    checks,
    fixes: failed.map(f => f.fix)
  };
}

module.exports = {
  buildStudioReady
};