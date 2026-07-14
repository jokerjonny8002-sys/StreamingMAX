const { exec } = require("child_process");

function run(command) {
    return new Promise((resolve) => {
        exec(command, (err, stdout) => {
            resolve(stdout || "");
        });
    });
}

async function getTopMemoryProcesses() {

    const output = await run(
        "ps -Arcxo pid,comm,%cpu,rss | sort -nr -k4 | head -11"
    );

    const lines = output
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

module.exports = {

    getTopMemoryProcesses

};