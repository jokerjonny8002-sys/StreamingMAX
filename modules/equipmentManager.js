const fs = require("fs");
const path = require("path");

const equipmentRoot = path.join(
  __dirname,
  "..",
  "assets",
  "equipment"
);

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(`Equipment file error: ${filePath}`, error);
    return [];
  }
}

function loadEquipmentDatabase() {
  const equipment = [];

  if (!fs.existsSync(equipmentRoot)) {
    return equipment;
  }

  const categories = fs.readdirSync(equipmentRoot, {
    withFileTypes: true
  });

  for (const category of categories) {
    if (!category.isDirectory()) continue;

    const categoryPath = path.join(
      equipmentRoot,
      category.name
    );

    const files = fs.readdirSync(categoryPath)
      .filter(file => file.endsWith(".json"));

    for (const file of files) {
      const devices = readJsonFile(
        path.join(categoryPath, file)
      );

      for (const device of devices) {
        equipment.push({
          ...device,
          equipmentType: category.name
        });
      }
    }
  }

  return equipment;
}

function searchEquipment(query = "") {
  const normalized = String(query).trim().toLowerCase();
  const equipment = loadEquipmentDatabase();

  if (!normalized) return equipment;

  return equipment.filter(device => {
    const haystack = [
      device.name,
      device.brand,
      device.category,
      device.equipmentType,
      ...(device.software || []),
      ...(device.usbDetect || [])
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

function getEquipmentById(id) {
  return loadEquipmentDatabase()
    .find(device => device.id === id) || null;
}

module.exports = {
  loadEquipmentDatabase,
  searchEquipment,
  getEquipmentById
};
