const fs = require("fs");
const path = require("path");

const PACKAGES_DIR = path.resolve(process.env.HOME, "medusa-packages/packages");
const OUTPUT_FILE = path.resolve(__dirname, "resolutions.json");
const PACKAGE_JSON_PATH = path.resolve(__dirname, "package.json");
// Recursively collect .tgz files
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".tgz")) {
      return fullPath;
    }
    return [];
  });
}

// Convert "medusajs-admin-sdk-2.8.3" → "@medusajs/admin-sdk"
function inferScopedPackageName(fileName) {
  const base = path.basename(fileName, ".tgz");
  const match = base.match(/^medusajs-(.+)-(\d+\.\d+\.\d+)$/);
  if (!match) {
    console.error(`Invalid tgz filename format: ${fileName}`);
    return "";
  }
  const name = match[1]; // e.g., "admin-sdk"
  return `@medusajs/${name}`;
}

function extractVersion(fileName) {
  const match = fileName.match(/-(\d+\.\d+\.\d+)\.tgz$/);
  return match ? match[1] : null;
}

// Build resolutions map
function toResolutions(tgzPaths) {
  const resolutions = {};
  for (const tgzPath of tgzPaths) {
    const absolutePath = path.resolve(tgzPath);
    const fileName = path.basename(tgzPath);
    const packageName = inferScopedPackageName(fileName);
    if (!packageName) continue;
    resolutions[packageName] = `file:${absolutePath}`;
  }
  return resolutions;
}

function injectIntoPackageJson(resolutions) {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf-8"));
  pkg.resolutions = {
    ...(pkg.resolutions || {}),
    ...resolutions,
  };
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2));
  console.log(
    `✅ Injected ${
      Object.keys(resolutions).length
    } resolutions into package.json`
  );
}

function main() {
  const tgzPaths = walk(PACKAGES_DIR);
  const resolutions = toResolutions(tgzPaths);
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify({ resolutions }, null, 2),
    "utf-8"
  );
  injectIntoPackageJson(resolutions);
  console.log(
    `✅ resolutions.json written with ${
      Object.keys(resolutions).length
    } entries.`
  );
}

main();
