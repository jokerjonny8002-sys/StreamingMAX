// ======================================================
// ATLAS STATE MANAGER
// Central shared state for StreamingMAX
// ======================================================

(function initializeAtlasStateManager() {

    const config = window.StreamingMaxConfig;

    if (config && !config.loaded) {
    config.load();
}

    const defaultState = {
        commander: {
            name: "",
            callsign: "Commander",
            greeting: ""
        },

        mission: "dj-performance",
        lastDepartment: "commander",
        startupGreeting: true,
        rememberDepartment: true,
        connected: false,

        network: {
            downloadMbps: null,
            uploadMbps: null,
            latencyMs: null,
            rating: "UNKNOWN"
        },

        obs: {
            connected: false
        },

        rekordbox: {
            running: false
        }
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function mergeState(defaults, saved) {
        return {
            ...defaults,
            ...saved,

            commander: {
                ...defaults.commander,
                ...(saved?.commander || {})
            },

            network: {
                ...defaults.network,
                ...(saved?.network || {})
            },

            obs: {
                ...defaults.obs,
                ...(saved?.obs || {})
            },

            rekordbox: {
                ...defaults.rekordbox,
                ...(saved?.rekordbox || {})
            }
        };
    }

    let state = clone(defaultState);

    if (config) {
        const savedState = config.get("atlasState");

        if (savedState) {
            state = mergeState(defaultState, savedState);
        }
    }

    const listeners = new Set();

    function notify() {
        const snapshot = clone(state);

        listeners.forEach((listener) => {
            try {
                listener(snapshot);
            } catch (error) {
                console.error(
                    "ATLAS state listener failed:",
                    error
                );
            }
        });
    }

    function save() {
        if (!config) {
            console.warn(
                "ATLAS state could not save because StreamingMaxConfig is unavailable."
            );
            return false;
        }

        config.set("atlasState", state);

        console.log(
            "ATLAS state saved.",
            clone(state)
        );

        return true;
    }

    function getState() {
        return clone(state);
    }

    function get(path) {
        if (!path) {
            return getState();
        }

        return path
            .split(".")
            .reduce(
                (current, key) =>
                    current?.[key],
                state
            );
    }

    function set(path, value, shouldSave = true) {
        if (!path) {
            console.error(
                "ATLAS state set requires a path."
            );
            return false;
        }

        const keys = path.split(".");
        const finalKey = keys.pop();

        let target = state;

        for (const key of keys) {
            if (
                !target[key] ||
                typeof target[key] !== "object"
            ) {
                target[key] = {};
            }

            target = target[key];
        }

        target[finalKey] = value;

        if (shouldSave) {
            save();
        }

        notify();

        return true;
    }

    function update(values, shouldSave = true) {
        state = mergeState(state, values);

        if (shouldSave) {
            save();
        }

        notify();

        return true;
    }

    function updateCommander(profile, shouldSave = true) {
        state.commander = {
            ...state.commander,
            ...profile
        };

        state.mission =
            profile.mission ??
            state.mission;

        state.startupGreeting =
            profile.startupGreeting ??
            state.startupGreeting;

        state.rememberDepartment =
            profile.rememberDepartment ??
            state.rememberDepartment;

        state.connected = true;

        if (shouldSave) {
            save();
        }

        notify();

        return true;
    }

    function subscribe(listener) {
        if (typeof listener !== "function") {
            return () => {};
        }

        listeners.add(listener);

        listener(getState());

        return () => {
            listeners.delete(listener);
        };
    }

    function reset() {
        state = clone(defaultState);
        save();
        notify();
    }

    window.AtlasState = {
        getState,
        get,
        set,
        update,
        updateCommander,
        subscribe,
        save,
        reset
    };

    console.log(
        "ATLAS CORE ONLINE",
        getState()
    );

})();