const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("streamingMax", {
  getSystemInfo: () => ipcRenderer.invoke("get-system-info"),
  getLiveStats: () => ipcRenderer.invoke("get-live-stats"),
  runMode: mode => ipcRenderer.invoke("run-mode", mode),
  getTopProcesses: () => ipcRenderer.invoke("get-top-processes"),
  detectStudio: () => ipcRenderer.invoke("detect-studio"),
  getStudioReady: () => ipcRenderer.invoke("studio-ready"),
  getReadiness: () => ipcRenderer.invoke("get-readiness"),
  runSpeedTest: () => ipcRenderer.invoke("run-speed-test")
});