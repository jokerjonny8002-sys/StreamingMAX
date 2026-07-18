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

    return {
      pid: parts[0],
      name: parts[1],
      cpu: Number(parts[2]),
      ramMB: Math.round(Number(parts[3]) / 1024)
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
