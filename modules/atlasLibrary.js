const fs = require("fs");
const path = require("path");

const libraryRoot = path.join(
  __dirname,
  "..",
  "assets",
  "atlas",
  "library"
);

const equipmentRoot = path.join(
  __dirname,
  "..",
  "assets",
  "equipment"
);

function readJson(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) return fallback;

    const raw = fs.readFileSync(filePath, "utf8").trim();

    if (!raw) return fallback;

    return JSON.parse(raw);
  } catch (error) {
    console.error(`ATLAS Library read error: ${filePath}`, error);
    return fallback;
  }
}

function walkJsonFiles(folderPath) {
  if (!fs.existsSync(folderPath)) return [];

  const files = [];

  for (const entry of fs.readdirSync(folderPath, {
    withFileTypes: true
  })) {
    const entryPath = path.join(folderPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkJsonFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(entryPath);
    }
  }

  return files;
}

function normalizeDevice(device, sourceFile = "") {
  return {
    ...device,
    id: String(device.id || "").trim(),
    name: String(
      device.name ||
      device.model ||
      ""
    ).trim(),
    brand: String(
      device.brand ||
      device.manufacturer ||
      ""
    ).trim(),
    sourceFile
  };
}

function loadEquipment() {
  const devices = [];
  const seenIds = new Set();

  for (const filePath of walkJsonFiles(equipmentRoot)) {
    const records = readJson(filePath, []);

    if (!Array.isArray(records)) continue;

    for (const record of records) {
      const device = normalizeDevice(
        record,
        path.relative(equipmentRoot, filePath)
      );

      if (!device.id || seenIds.has(device.id)) continue;

      seenIds.add(device.id);
      devices.push(device);
    }
  }

  const masterFile = path.join(
    libraryRoot,
    "equipment.json"
  );

  const masterRecords = readJson(masterFile, []);

  if (Array.isArray(masterRecords)) {
    for (const record of masterRecords) {
      const device = normalizeDevice(
        record,
        "atlas/library/equipment.json"
      );

      if (!device.id || seenIds.has(device.id)) continue;

      seenIds.add(device.id);
      devices.push(device);
    }
  }

  return devices;
}

function searchableText(device) {
  return [
    device.id,
    device.name,
    device.model,
    device.brand,
    device.manufacturer,
    device.family,
    device.category,
    device.subcategory,
    device.description,
    device.status,
    ...(device.software || []),
    ...(device.usbDetect || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function search(query = "") {
  const normalized = String(query)
    .trim()
    .toLowerCase();

  const devices = loadEquipment();

  if (!normalized) return devices;

  return devices.filter(device =>
    searchableText(device).includes(normalized)
  );
}

function get(deviceId) {
  const normalized = String(deviceId || "").trim();

  return loadEquipment().find(device =>
    device.id === normalized ||
    device.legacyId === normalized
  ) || null;
}

function findByManufacturer(manufacturer = "") {
  const normalized = String(manufacturer)
    .trim()
    .toLowerCase();

  return loadEquipment().filter(device => {
    const brand = String(
      device.manufacturer ||
      device.brand ||
      ""
    ).toLowerCase();

    return brand.includes(normalized);
  });
}

function getCategories() {
  return [
    ...new Set(
      loadEquipment()
        .map(device =>
          device.category ||
          device.equipmentType
        )
        .filter(Boolean)
    )
  ].sort();
}

function getStats() {
  const devices = loadEquipment();

  return {
    deviceCount: devices.length,
    manufacturerCount: new Set(
      devices
        .map(device =>
          device.manufacturer ||
          device.brand
        )
        .filter(Boolean)
    ).size,
    categoryCount: getCategories().length
  };
}

module.exports = {
  loadEquipment,
  search,
  get,
  findByManufacturer,
  getCategories,
  getStats
};
