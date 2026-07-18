const DEFAULT_STATE = Object.freeze({
  performance: {
    status: "checking",
    cpuPercent: null,
    memoryPercent: null,
    storagePercent: null,
    temperatureF: null,
    missionImpact: "checking"
  },

  network: {
    status: "checking",
    downloadMbps: null,
    uploadMbps: null,
    latencyMs: null,
    packetLossPercent: null,
    ipv4: null,
    gateway: null,
    adapter: null,
    dns: null
  },

  studio: {
    status: "checking",
    obsRunning: false,
    rekordboxRunning: false,
    rx3Connected: null,
    cameraConnected: null,
    audioInterfaceConnected: null,
    equipment: []
  },

  safeguards: {
    sleepGuardActive: false
  },

  mission: {
    type: "streaming",
    readinessScore: 0,
    status: "checking",
    primaryIssue: null
  },

  updatedAt: null
});

let currentState = createDefaultState();

function createDefaultState() {
  return structuredClone(DEFAULT_STATE);
}

function getState() {
  return structuredClone(currentState);
}

function resetState() {
  currentState = createDefaultState();
  currentState.updatedAt = new Date().toISOString();

  return getState();
}

function updateSection(sectionName, values = {}) {
  if (!Object.prototype.hasOwnProperty.call(currentState, sectionName)) {
    throw new Error(
      `Unknown mission-state section: ${sectionName}`
    );
  }

  if (
    typeof currentState[sectionName] !== "object" ||
    Array.isArray(currentState[sectionName])
  ) {
    throw new Error(
      `Mission-state section is not updateable: ${sectionName}`
    );
  }

  currentState[sectionName] = {
    ...currentState[sectionName],
    ...values
  };

  currentState.updatedAt = new Date().toISOString();

  return getState();
}

function replaceState(nextState) {
  if (!nextState || typeof nextState !== "object") {
    throw new TypeError("Mission state must be an object.");
  }

  currentState = {
    ...createDefaultState(),
    ...structuredClone(nextState),
    updatedAt: new Date().toISOString()
  };

  return getState();
}

module.exports = {
  getState,
  resetState,
  updateSection,
  replaceState
};
