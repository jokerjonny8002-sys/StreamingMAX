const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("streamingMax", {
  launchStudioApp: appName =>
    ipcRenderer.invoke("launch-studio-app", appName),

  getEquipmentDatabase: () =>
    ipcRenderer.invoke("get-equipment-database"),

  searchEquipment: query =>
    ipcRenderer.invoke("search-equipment", query),

  getEquipmentById: id =>
    ipcRenderer.invoke("get-equipment-by-id", id),

  atlasLibrarySearch: query =>
    ipcRenderer.invoke("atlas-library-search", query),

  atlasLibraryGet: deviceId =>
    ipcRenderer.invoke("atlas-library-get", deviceId),

  atlasLibraryStats: () =>
    ipcRenderer.invoke("atlas-library-stats"),

  atlasLibraryCategories: () =>
    ipcRenderer.invoke("atlas-library-categories"),

  atlasLibraryManufacturer: manufacturer =>
    ipcRenderer.invoke(
      "atlas-library-manufacturer",
      manufacturer
    ),

  getSystemInfo: () =>
    ipcRenderer.invoke("get-system-info"),

  getLiveStats: () =>
    ipcRenderer.invoke("get-live-stats"),

  runMode: mode =>
    ipcRenderer.invoke("run-mode", mode),

  getTopProcesses: () =>
    ipcRenderer.invoke("get-top-processes"),

  endProcess: pid =>
    ipcRenderer.invoke("end-process", pid),

  detectStudio: () =>
    ipcRenderer.invoke("detect-studio"),

  getStudioReady: () =>
    ipcRenderer.invoke("studio-ready"),

  getReadiness: () =>
    ipcRenderer.invoke("get-readiness"),

  getMissionState: () =>
    ipcRenderer.invoke("get-mission-state"),

  getAtlasMessage: () =>
    ipcRenderer.invoke("get-atlas-message"),

  atlasChat: message =>
    ipcRenderer.invoke("atlas-chat", message),

  runPreflightCheck: () =>
    ipcRenderer.invoke("run-preflight-check"),

  setSleepGuard: enabled =>
    ipcRenderer.invoke("set-sleep-guard", enabled),

  getSleepGuard: () =>
    ipcRenderer.invoke("get-sleep-guard"),

  getProfile: () =>
    ipcRenderer.invoke("get-profile"),

  saveProfile: profile =>
    ipcRenderer.invoke("save-profile", profile),

  runSpeedTest: () =>
    ipcRenderer.invoke("run-speed-test")
});
