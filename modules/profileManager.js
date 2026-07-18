const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const defaultProfile = {
  setupComplete: false,
  realName: "",
  djName: "",
  nickname: "",
  preferredNameType: "realName",
  atlasPersonality: "casual",
  atlasHumor: "friendly",
  studioEquipment: []
};

function getProfilePath() {
  return path.join(app.getPath("userData"), "profile.json");
}

function getProfile() {
  const profilePath = getProfilePath();

  try {
    if (!fs.existsSync(profilePath)) {
      return { ...defaultProfile };
    }

    const saved = JSON.parse(
      fs.readFileSync(profilePath, "utf8")
    );

    return {
      ...defaultProfile,
      ...saved
    };
  } catch (error) {
    console.error("Profile read error:", error);
    return { ...defaultProfile };
  }
}

function saveProfile(profile) {
  const profilePath = getProfilePath();

  const cleanProfile = {
    ...defaultProfile,
    ...profile,
    setupComplete: true
  };

  fs.mkdirSync(path.dirname(profilePath), {
    recursive: true
  });

  fs.writeFileSync(
    profilePath,
    JSON.stringify(cleanProfile, null, 2),
    "utf8"
  );

  return cleanProfile;
}

function getDisplayName(profile = getProfile()) {
  const selected =
    profile[profile.preferredNameType];

  return (
    selected?.trim() ||
    profile.djName?.trim() ||
    profile.nickname?.trim() ||
    profile.realName?.trim() ||
    "Streamer"
  );
}

module.exports = {
  getProfile,
  saveProfile,
  getDisplayName
};
