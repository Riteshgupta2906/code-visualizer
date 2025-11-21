import { findFilesImporting } from "./lib/analyzers/dependency-analyzer.js";
import path from "path";

const projectRoot = process.cwd();
const targetFile = path.join(projectRoot, "lib/analyzers/dependency-analyzer.js");

console.log(`Finding files importing: ${targetFile}`);

const importingFiles = findFilesImporting(targetFile, projectRoot);

console.log("Importing files:");
importingFiles.forEach(f => console.log(`- ${f}`));

const expectedFile = path.join(projectRoot, "app/api/analyze-dependencies/route.js");
const found = importingFiles.includes(expectedFile);

if (found) {
  console.log("SUCCESS: Found expected importing file.");
  process.exit(0);
} else {
  console.error("FAILURE: Did not find expected importing file.");
  process.exit(1);
}
