/**
 * StreamingMAX Configuration Manager
 *
 * Centralized configuration system for:
 * - Commander profile
 * - ATLAS settings
 * - Studio settings
 * - Interface preferences
 * - Automation settings
 * - Future Mission Command modules
 */

(() => {
  "use strict";

  const STORAGE_KEY = "streamingMaxConfiguration";

  const DEFAULT_CONFIGURATION = {
    version: 1,

    commander: {
      name: "",
      callsign: "",
      greeting: "Welcome, Commander.",
      mission: "general",
      startupGreeting: true,
      rememberDepartment: true
    },

    atlas: {
      enabled: true,
      personality: "standard",
      voiceEnabled: false,
      voice: "default",
      wakeWord: "Atlas"
    },

    studio: {
      autoLaunchRekordbox: false,
      autoLaunchObs: false,
      defaultDepartment: "home",
      recordingFolder: "",
      streamProfile: "default"
    },

    automation: {
      enabled: true,
      autoBackup: true,
      backupIntervalHours: 24,
      autoCleanup: false
    },

    interface: {
      theme: "default",
      animationsEnabled: true,
      rememberMissionCommandModule: true
    },

    memory: {
      enabled: true,
      rememberCommanderProfile: true
    }
  };

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isPlainObject(value) {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }

  function mergeDefaults(defaultValue, savedValue) {
    if (!isPlainObject(defaultValue)) {
      return savedValue === undefined
        ? deepClone(defaultValue)
        : savedValue;
    }

    const result = {};

    Object.keys(defaultValue).forEach((key) => {
      result[key] = mergeDefaults(
        defaultValue[key],
        savedValue?.[key]
      );
    });

    if (isPlainObject(savedValue)) {
      Object.keys(savedValue).forEach((key) => {
        if (!(key in result)) {
          result[key] = savedValue[key];
        }
      });
    }

    return result;
  }

  class ConfigurationManager {
    constructor() {
      this.configuration = deepClone(DEFAULT_CONFIGURATION);
      this.loaded = false;
    }

    load() {
      try {
        const storedValue = localStorage.getItem(STORAGE_KEY);

        if (!storedValue) {
          this.configuration = deepClone(DEFAULT_CONFIGURATION);
          this.save();
          this.loaded = true;

          console.info(
            "StreamingMAX configuration created using defaults."
          );

          return this.configuration;
        }

        const savedConfiguration = JSON.parse(storedValue);

        this.configuration = mergeDefaults(
          DEFAULT_CONFIGURATION,
          savedConfiguration
        );

        this.loaded = true;

        console.info(
          "StreamingMAX configuration loaded successfully."
        );

        return this.configuration;
      } catch (error) {
        console.error(
          "StreamingMAX configuration could not be loaded:",
          error
        );

        this.configuration = deepClone(DEFAULT_CONFIGURATION);
        this.loaded = true;

        return this.configuration;
      }
    }

    save() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(this.configuration, null, 2)
        );

        window.dispatchEvent(
          new CustomEvent("streamingmax:configuration-saved", {
            detail: deepClone(this.configuration)
          })
        );

        console.info(
          "StreamingMAX configuration saved successfully."
        );

        return true;
      } catch (error) {
        console.error(
          "StreamingMAX configuration could not be saved:",
          error
        );

        return false;
      }
    }

    get(path, fallbackValue = undefined) {
      if (!path) {
        return deepClone(this.configuration);
      }

      const keys = path.split(".");
      let currentValue = this.configuration;

      for (const key of keys) {
        if (
          currentValue === null ||
          currentValue === undefined ||
          !Object.prototype.hasOwnProperty.call(currentValue, key)
        ) {
          return fallbackValue;
        }

        currentValue = currentValue[key];
      }

      return currentValue;
    }

    set(path, value, saveImmediately = true) {
      if (!path || typeof path !== "string") {
        console.error(
          "ConfigurationManager.set requires a valid path."
        );

        return false;
      }

      const keys = path.split(".");
      const finalKey = keys.pop();

      let currentObject = this.configuration;

      for (const key of keys) {
        if (!isPlainObject(currentObject[key])) {
          currentObject[key] = {};
        }

        currentObject = currentObject[key];
      }

      currentObject[finalKey] = value;

      if (saveImmediately) {
        return this.save();
      }

      return true;
    }

    update(sectionPath, values, saveImmediately = true) {
      if (!isPlainObject(values)) {
        console.error(
          "ConfigurationManager.update requires an object."
        );

        return false;
      }

      const currentSection = this.get(sectionPath, {});

      const updatedSection = {
        ...currentSection,
        ...values
      };

      return this.set(
        sectionPath,
        updatedSection,
        saveImmediately
      );
    }

    reset() {
      this.configuration = deepClone(DEFAULT_CONFIGURATION);

      const saved = this.save();

      window.dispatchEvent(
        new CustomEvent("streamingmax:configuration-reset", {
          detail: deepClone(this.configuration)
        })
      );

      return saved;
    }

    export() {
      return JSON.stringify(
        this.configuration,
        null,
        2
      );
    }

    import(configurationText) {
      try {
        const importedConfiguration =
          typeof configurationText === "string"
            ? JSON.parse(configurationText)
            : configurationText;

        if (!isPlainObject(importedConfiguration)) {
          throw new Error(
            "Imported configuration must be an object."
          );
        }

        this.configuration = mergeDefaults(
          DEFAULT_CONFIGURATION,
          importedConfiguration
        );

        return this.save();
      } catch (error) {
        console.error(
          "StreamingMAX configuration import failed:",
          error
        );

        return false;
      }
    }

    getDefaults() {
      return deepClone(DEFAULT_CONFIGURATION);
    }
  }

  const streamingMaxConfig =
    new ConfigurationManager();

  window.StreamingMaxConfig = streamingMaxConfig;

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      if (!streamingMaxConfig.loaded) {
        streamingMaxConfig.load();
      }
    }
  );
})();
