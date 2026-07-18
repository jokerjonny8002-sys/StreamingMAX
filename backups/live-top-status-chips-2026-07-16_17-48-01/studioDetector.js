const { exec } = require("child_process");
const path = require("path");

let cachedResult = null;
let cachedAt = 0;
const CACHE_MS = 5000;

function run(command) {
  return new Promise(resolve => {
    exec(command, { timeout: 12000, maxBuffer: 8 * 1024 * 1024 }, (_error, stdout) => {
      resolve(stdout || "");
    });
  });
}

async function getRunningExecutableNames() {
  const output = await run("ps -axo comm=");
  return output
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(commandPath => path.basename(commandPath).toLowerCase());
}

function findHardwareName(text, patterns) {
  const lines = String(text || "")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  return (lines.find(line => patterns.some(pattern => pattern.test(line))) || "")
    .replace(/:$/, "")
    .trim();
}

async function detectStudio() {
  const now = Date.now();
  if (cachedResult && now - cachedAt < CACHE_MS) return cachedResult;

  const [running, hardwareOutput] = await Promise.all([
    getRunningExecutableNames(),
    run("system_profiler SPAudioDataType SPCameraDataType SPUSBDataType 2>/dev/null")
  ]);

  const rekordbox = running.includes("rekordbox");
  const obs = running.includes("obs");
  const rx3 = /xdj[\s-]*rx3|pioneer dj xdj[\s-]*rx3/i.test(hardwareOutput);
  const focusrite = /focusrite|scarlett/i.test(hardwareOutput);
  const sonyCamera = /sony|ilce[\s-]*6400|a6400/i.test(hardwareOutput);
  const otherCamera = /obsbot|logitech.*(?:camera|webcam)|brio|c920|c922|facetime hd camera/i.test(hardwareOutput);
  const camera = sonyCamera || otherCamera;

  cachedResult = {
    rekordbox,
    obs,
    rx3,
    rx3Name: findHardwareName(hardwareOutput, [/xdj[\s-]*rx3/i, /pioneer dj.*rx3/i]),
    focusrite,
    focusriteName: findHardwareName(hardwareOutput, [/scarlett/i, /focusrite/i]),
    camera,
    sonyCamera,
    cameraName: findHardwareName(hardwareOutput, [/ilce[\s-]*6400/i, /a6400/i, /sony/i, /obsbot/i, /brio/i, /c920/i, /c922/i, /facetime hd camera/i]),
    ready: rekordbox && obs
  };

  cachedAt = now;
  return cachedResult;
}

module.exports = { detectStudio };
