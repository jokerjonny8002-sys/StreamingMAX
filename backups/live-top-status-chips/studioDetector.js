const { exec } = require("child_process");
const path = require("path");

function run(command) {
  return new Promise(resolve => {
    exec(command, (error, stdout) => {
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
    .map(commandPath =>
      path.basename(commandPath).toLowerCase()
    );
}

async function detectStudio() {
  const running =
    await getRunningExecutableNames();

  /*
   * Exact executable matching avoids false positives
   * from helper processes, search commands, and paths
   * that merely contain the application name.
   */
  const rekordbox =
    running.includes("rekordbox");

  const obs =
    running.includes("obs");

  // Hardware detection will be added later.
  const focusrite = false;
  const camera = false;

  return {
    rekordbox,
    obs,
    focusrite,
    camera,
    ready: rekordbox && obs
  };
}

module.exports = {
  detectStudio
};
