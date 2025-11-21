const madge = require("madge");
const path = require("path");
const fs = require("fs");

async function analyzeProject(projectPath) {
  // 1. Detect the config file (tsconfig.json or jsconfig.json)
  const tsConfigPath = path.join(projectPath, "tsconfig.json");
  const jsConfigPath = path.join(projectPath, "jsconfig.json");

  let configFilePath = null;

  if (fs.existsSync(tsConfigPath)) {
    configFilePath = tsConfigPath;
    console.log("✅ Detected tsconfig.json");
  } else if (fs.existsSync(jsConfigPath)) {
    configFilePath = jsConfigPath;
    console.log("✅ Detected jsconfig.json");
  } else {
    console.warn(
      "⚠️ No tsconfig or jsconfig found. Aliases like '@/' might fail."
    );
  }

  // 2. Configure Madge
  const config = {
    fileExtensions: ["js", "jsx", "ts", "tsx"],
    excludeRegExp: [/^test\//, /\.spec\.js$/, /node_modules/],

    // CRITICAL: This tells Madge how to read the "@" path
    tsConfig: configFilePath,
  };

  try {
    // 3. Run Madge with the detected config
    const res = await madge(projectPath, config);

    const forwardGraph = res.obj();
    const reverseGraph = generateReverseDependencies(forwardGraph);

    return { forward: forwardGraph, reverse: reverseGraph };
  } catch (error) {
    console.error("Error running Madge:", error);
    return null;
  }
}

function generateReverseDependencies(forwardGraph) {
  const reverseGraph = {};

  // Initialize
  Object.keys(forwardGraph).forEach((file) => (reverseGraph[file] = []));

  // Invert
  Object.entries(forwardGraph).forEach(([importer, imports]) => {
    imports.forEach((importedFile) => {
      if (reverseGraph[importedFile]) {
        reverseGraph[importedFile].push(importer);
      }
    });
  });

  return reverseGraph;
}

// --- TEST IT ---
(async () => {
  // Point this to your Next.js root folder (where package.json is)
  const nextProjectRoot = path.resolve(__dirname);

  const data = await analyzeProject(nextProjectRoot);

  // Example Check: See if it found the file at alias
  console.log("Dependencies for a component:");
  // Replace this key with a real file in your project to test
  console.log(
    data?.forward["components/Button.js"] || "File not found in graph"
  );
})();
