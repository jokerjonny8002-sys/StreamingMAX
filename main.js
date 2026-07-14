const { app, BrowserWindow, ipcMain } = require("electron");
app.disableHardwareAcceleration();
const path = require("path");
const os = require("os");
const si = require("systeminformation");
const { exec } = require("child_process");
const { calculatePerformance } = require("./modules/performanceEngine");
const { getTopMemoryProcesses } = require("./modules/processMonitor");
const { detectStudio } = require("./modules/studioDetector");
const { buildStudioReady } = require("./modules/studioReady");

let mainWindow;
let caffeinateProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1250,
    height: 820,
    minWidth: 1050,
    minHeight: 720,
    backgroundColor: "#05070f",
    title: "StreamingMAX",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile("layouts/cockpit.html");
  mainWindow.once("ready-to-show", () => mainWindow.show());
}

function runCommand(command) {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        stdout: stdout || "",
        stderr: stderr || "",
        error: error ? error.message : ""
      });
    });
  });
}

async function isProcessRunning(name) {
  const result = await runCommand(`pgrep -ifl "${name}"`);
  return result.stdout.trim().length > 0;
}

function startCaffeinate() {
  if (caffeinateProcess) return "Sleep prevention already active.";
  caffeinateProcess = exec("caffeinate -dimsu", () => {});
  return "Sleep prevention enabled.";
}

function stopCaffeinate() {
  if (!caffeinateProcess) return "Sleep prevention was not active.";
  caffeinateProcess.kill();
  caffeinateProcess = null;
  return "Sleep prevention disabled.";
}

async function getLiveStats() {
  const [cpuLoad, mem, fsSize, netStats] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.networkStats()
  ]);

  const mainDisk = fsSize && fsSize.length ? fsSize[0] : null;
  const mainNet = netStats && netStats.length ? netStats[0] : null;

  const cpuPercent = Math.round(cpuLoad.currentLoad || 0);
  const ramPercent = Math.round((mem.used / mem.total) * 100);
  const diskPercent = mainDisk ? Math.round(mainDisk.use || 0) : 0;

  const uploadMbps = mainNet ? mainNet.tx_sec * 8 / 1000000 : 0;
  const downloadMbps = mainNet ? mainNet.rx_sec * 8 / 1000000 : 0;

  const baseStats = {
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname(),
    cpuPercent,
    ramPercent,
    diskPercent,
    freeMemoryGB: Number((mem.available / 1073741824).toFixed(1)),
    totalMemoryGB: Number((mem.total / 1073741824).toFixed(1)),
    uploadMbps: Number(uploadMbps.toFixed(2)),
    downloadMbps: Number(downloadMbps.toFixed(2)),
    rekordboxRunning: await isProcessRunning("rekordbox"),
    obsRunning: await isProcessRunning("OBS|obs"),
    sleepPreventionActive: Boolean(caffeinateProcess),
    uptime: os.uptime()
  };

  const performance = calculatePerformance(baseStats);

  return {
    ...baseStats,
    performanceScore: performance.score,
    performanceGrade: performance.grade,
    streamReady: performance.streamReady,
    droppedFrameRisk: performance.droppedFrameRisk,
    networkHealth: performance.networkHealth,
    bitrateRecommendation: performance.bitrateRecommendation,
    warnings: performance.warnings,
    recommendations: performance.recommendations
  };
}

async function getFolderSize(folderPath) {
  const result = await runCommand(`du -sk "${folderPath}" 2>/dev/null | awk '{print $1}'`);
  const kb = Number(result.stdout.trim()) || 0;
  return kb * 1024;
}

async function cleanMode() {
  const home = os.homedir();

  const targets = [
    `${home}/Library/Caches`,
    `${home}/Library/Logs`,
    `${home}/Library/Application Support/CrashReporter`,
    `${home}/.Trash`
  ];

  let beforeBytes = 0;
  for (const target of targets) beforeBytes += await getFolderSize(target);

  await runCommand(`rm -rf "${home}/Library/Caches/"* 2>/dev/null`);
  await runCommand(`rm -rf "${home}/Library/Logs/"* 2>/dev/null`);
  await runCommand(`rm -rf "${home}/Library/Application Support/CrashReporter/"* 2>/dev/null`);
  await runCommand(`rm -rf "${home}/.Trash/"* 2>/dev/null`);
  await runCommand(`dscacheutil -flushcache 2>/dev/null`);
  await runCommand(`killall -HUP mDNSResponder 2>/dev/null`);

  let afterBytes = 0;
  for (const target of targets) afterBytes += await getFolderSize(target);

  const recoveredGB = Math.max(0, (beforeBytes - afterBytes) / 1073741824);

  return {
    mode: "Clean Mode",
    success: true,
    messages: [
      "User cache cleaned.",
      "User logs cleaned.",
      "Crash reports cleaned.",
      "Trash emptied.",
      "DNS cache flushed.",
      `Estimated recovered space: ${recoveredGB.toFixed(2)} GB.`
    ]
  };
}

async function djMode() {
  const stats = await getLiveStats();
  const sleepMessage = startCaffeinate();

  return {
    mode: "DJ Mode",
    success: stats.rekordboxRunning,
    messages: [
      stats.rekordboxRunning ? "Rekordbox detected." : "Rekordbox is not currently running.",
      sleepMessage,
      `Performance Score: ${stats.performanceScore}/100 (${stats.performanceGrade}).`,
      `Dropped-frame risk: ${stats.droppedFrameRisk}.`,
      "DJ profile active."
    ]
  };
}

async function streamMode() {
  const stats = await getLiveStats();
  const sleepMessage = startCaffeinate();

  return {
    mode: "Stream Mode",
    success: true,
    messages: [
      stats.obsRunning ? "OBS detected." : "OBS is not currently running.",
      stats.rekordboxRunning ? "Rekordbox detected." : "Rekordbox is not currently running.",
      sleepMessage,
      `Network health: ${stats.networkHealth}.`,
      `Recommended OBS bitrate: ${stats.bitrateRecommendation} kbps.`,
      `Dropped-frame risk: ${stats.droppedFrameRisk}.`,
      "Stream profile active."
    ]
  };
}

async function preflightMode() {
  const stats = await getLiveStats();

  return {
    mode: "Preflight",
    success: stats.streamReady,
    messages: [
      `Performance Score: ${stats.performanceScore}/100 (${stats.performanceGrade}).`,
      stats.streamReady ? "READY TO STREAM." : "NOT READY YET.",
      `CPU: ${stats.cpuPercent}%.`,
      `RAM: ${stats.ramPercent}%.`,
      `Disk: ${stats.diskPercent}%.`,
      stats.obsRunning ? "OBS check passed." : "OBS is not running.",
      stats.rekordboxRunning ? "Rekordbox check passed." : "Rekordbox is not running.",
      `Network health: ${stats.networkHealth}.`,
      `Recommended bitrate: ${stats.bitrateRecommendation} kbps.`,
      `Dropped-frame risk: ${stats.droppedFrameRisk}.`,
      ...stats.warnings.map(w => `Warning: ${w}`),
      ...stats.recommendations.map(r => `Recommendation: ${r}`)
    ]
  };
}

const { calculateReadiness } = require("./modules/readinessEngine");

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {

    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopCaffeinate();
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("get-system-info", async () => getLiveStats());
ipcMain.handle("get-live-stats", async () => getLiveStats());
ipcMain.handle("get-top-processes", async () => {
  return getTopMemoryProcesses();
});
ipcMain.handle("detect-studio", async () => {
  return detectStudio();
});

ipcMain.handle("studio-ready", async () => {
  const stats = await getLiveStats();
  const studio = await detectStudio();
  const processes = await getTopMemoryProcesses();

  return buildStudioReady(stats, studio, processes);
});

const { runSpeedTest } = require("./modules/speedTest");

ipcMain.handle("run-mode", async (_event, mode) => {
  if (mode === "Clean Mode") return cleanMode();
  if (mode === "DJ Mode") return djMode();
  if (mode === "Stream Mode") return streamMode();
  if (mode === "Preflight") return preflightMode();

  return {
    mode,
    success: false,
    messages: ["Unknown mode."]
  };
});

ipcMain.handle("get-readiness", async () => {
  const stats = await getLiveStats();
  const studio = await detectStudio();

  return calculateReadiness(stats, studio);
});

ipcMain.handle("run-speed-test", async () => {
  return runSpeedTest();
});