const fs = require("fs");
const path = require("path");

const SETTINGS_FILE = path.join(
    __dirname,
    "..",
    "config",
    "layout.json"
);

const DEFAULT_LAYOUT = "classic";

function ensureConfigFolder() {

    const folder = path.dirname(SETTINGS_FILE);

    if (!fs.existsSync(folder)) {

        fs.mkdirSync(folder, {
            recursive: true
        });

    }

}

function getCurrentLayout() {

    ensureConfigFolder();

    if (!fs.existsSync(SETTINGS_FILE)) {

        saveCurrentLayout(DEFAULT_LAYOUT);

        return DEFAULT_LAYOUT;

    }

    try {

        const data =
            JSON.parse(
                fs.readFileSync(
                    SETTINGS_FILE,
                    "utf8"
                )
            );

        return data.layout || DEFAULT_LAYOUT;

    }

    catch {

        return DEFAULT_LAYOUT;

    }

}

function saveCurrentLayout(layout) {

    ensureConfigFolder();

    fs.writeFileSync(

        SETTINGS_FILE,

        JSON.stringify({

            layout

        }, null, 2)

    );

}

function getLayoutFile() {

    return getCurrentLayout() === "mission"

        ? "layouts/cockpit-v2.html"

        : "layouts/cockpit.html";

}

module.exports = {

    getCurrentLayout,

    saveCurrentLayout,

    getLayoutFile

};