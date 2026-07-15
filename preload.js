const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("streamingMax", {
  launchStudioApp: appName =>
  ipcRenderer.invoke("launch-studio-app", appName),
  getSystemInfo: () => ipcRenderer.invoke("get-system-info"),
  getLiveStats: () => ipcRenderer.invoke("get-live-stats"),
  runMode: mode => ipcRenderer.invoke("run-mode", mode),
  getTopProcesses: () => ipcRenderer.invoke("get-top-processes"),
  detectStudio: () => ipcRenderer.invoke("detect-studio"),
  getStudioReady: () => ipcRenderer.invoke("studio-ready"),
  getReadiness: () => ipcRenderer.invoke("get-readiness"),
  getAtlasMessage: () => ipcRenderer.invoke("get-atlas-message"),
  runPreflightCheck: () => ipcRenderer.invoke("run-preflight-check"),
  setSleepGuard: enabled =>
  ipcRenderer.invoke("set-sleep-guard", enabled),

getSleepGuard: () =>
  ipcRenderer.invoke("get-sleep-guard"),
  runSpeedTest: () => ipcRenderer.invoke("run-speed-test")
});