const { exec } = require("child_process");

function run(command) {
  return new Promise(resolve => {
    exec(command, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        stdout: stdout || "",
        stderr: stderr || "",
        error: error?.message || ""
      });
    });
  });
}

const processIntelligence = {
  "google chrome": {
    level: "safe",
    description: "Web browser"
  },
  chrome: {
    level: "safe",
    description: "Web browser"
  },
  safari: {
    level: "safe",
    description: "Apple web browser"
  },
  firefox: {
    level: "safe",
    description: "Web browser"
  },
  spotify: {
    level: "safe",
    description: "Music playback application"
  },
  discord: {
    level: "caution",
    description: "Voice and chat application"
  },
  zoom: {
    level: "caution",
    description: "Video meeting application"
  },
  slack: {
    level: "caution",
    description: "Team communication application"
  },
  obs: {
    level: "caution",
    description: "Streaming and recording software"
  },
  rekordbox: {
    level: "caution",
    description: "DJ performance software"
  },
  finder: {
    level: "caution",
    description: "macOS desktop and file manager"
  },
  dock: {
    level: "protected",
    description: "macOS application dock"
  },
  controlcenter: {
    level: "protected",
    description: "macOS Control Center"
  },
  notificationcenter: {
    level: "protected",
    description: "macOS notification service"
  },
  systemuiserver: {
    level: "protected",
    description: "macOS menu-bar service"
  },
  windowserver: {
    level: "protected",
    description: "macOS display and window engine"
  },
  kernel_task: {
    level: "protected",
    description: "Core macOS system process"
  },
  launchd: {
    level: "protected",
    description: "Core macOS service manager"
  },
  loginwindow: {
    level: "protected",
    description: "macOS user-session manager"
  },
  electron: {
    level: "protected",
    description: "StreamingMAX application engine"
  },
  streamingmax: {
    level: "protected",
    description: "StreamingMAX Mission Control"
  }
};

function getProcessIntelligence(name) {
  const normalized = normalizeProcessName(name);

  const exact = processIntelligence[normalized];

  if (exact) {
    return exact;
  }

  const partialMatch = Object.entries(
    processIntelligence
  ).find(([key]) =>
    normalized.includes(key)
  );

  if (partialMatch) {
    return partialMatch[1];
  }

  return {
    level: "caution",
    description:
      "Unrecognized process — verify before closing"
  };
}

async function getTopMemoryProcesses() {
  const result = await run(
    "ps -Arcxo pid,comm,%cpu,rss | sort -nr -k4 | head -11"
  );

  const lines = result.stdout
    .trim()
    .split("\n")
    .slice(1);

  return lines.map(line => {
    const parts = line.trim().split(/\s+/);
    const name = parts[1];
    const intelligence =
      getProcessIntelligence(name);

    return {
      pid: parts[0],
      name,
      cpu: Number(parts[2]),
      ramMB: Math.round(Number(parts[3]) / 1024),
      level: intelligence.level,
      description: intelligence.description,
      protected:
        intelligence.level === "protected"
    };
  });
}

const protectedProcessNames = [
  "streamingmax",
  "electron",
  "finder",
  "dock",
  "windowserver",
  "loginwindow",
  "kernel_task",
  "launchd",
  "systemuiserver"
];

function normalizeProcessName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .split("/")
    .pop();
}

function isProtectedProcess(name, pid) {
  const normalized = normalizeProcessName(name);

  if (Number(pid) === process.pid) {
    return true;
  }

  return protectedProcessNames.some(protectedName =>
    normalized === protectedName ||
    normalized.startsWith(`${protectedName}.`)
  );
}

async function endProcess(pid) {
  const numericPid = Number(pid);

  if (
    !Number.isInteger(numericPid) ||
    numericPid <= 1
  ) {
    return {
      success: false,
      message: "Invalid process identifier."
    };
  }

  const lookup = await run(
    `ps -p ${numericPid} -o comm=`
  );

  const processName = lookup.stdout.trim();

  if (!processName) {
    return {
      success: false,
      message: "That process is no longer running."
    };
  }

  if (isProtectedProcess(processName, numericPid)) {
    return {
      success: false,
      protected: true,
      processName,
      message:
        `${normalizeProcessName(processName)} is protected by ATLAS.`
    };
  }

  try {
    process.kill(numericPid, "SIGTERM");

    return {
      success: true,
      processName,
      message:
        `${normalizeProcessName(processName)} was asked to close.`
    };
  } catch (error) {
    return {
      success: false,
      processName,
      message:
        `Could not close ${normalizeProcessName(processName)}: ${error.message}`
    };
  }
}

module.exports = {
  getTopMemoryProcesses,
  endProcess
};
