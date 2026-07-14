const { exec } = require("child_process");

function run(command) {
    return new Promise((resolve) => {
        exec(command, (err, stdout) => {
            resolve(stdout || "");
        });
    });
}

async function processExists(name) {
    const output = await run(`pgrep -ifl "${name}"`);
    return output.trim().length > 0;
}

async function detectStudio() {

    const rekordbox = await processExists("rekordbox");
    const obs = await processExists("OBS|obs");

    // Future expansion
    const focusrite = false;
    const camera = false;

    return {

        rekordbox,

        obs,

        focusrite,

        camera,

        ready:
            rekordbox &&
            obs

    };

}

module.exports = {

    detectStudio

};