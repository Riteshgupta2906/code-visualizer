#!/usr/bin/env node

import madge from "madge";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reads tsconfig.json or jsconfig.json to extract path aliases
 */
function extractPathAliases(projectPath) {
  const configFiles = ["tsconfig.json", "jsconfig.json"];

  for (const configFile of configFiles) {
    const configPath = path.join(projectPath, configFile);

    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, "utf8");
        // Remove comments (simple approach)
        const cleanContent = configContent.replace(
          /\/\*[\s\S]*?\*\/|\/\/.*/g,
          ""
        );
        const config = JSON.parse(cleanContent);

        if (config.compilerOptions?.paths) {
          const aliases = {};
          const baseUrl = config.compilerOptions.baseUrl || ".";

          Object.entries(config.compilerOptions.paths).forEach(
            ([alias, paths]) => {
              // Convert "@/*" to "@" for webpack alias format
              const cleanAlias = alias.replace("/*", "");
              const targetPath = paths[0].replace("/*", "");

              // Resolve to absolute path
              aliases[cleanAlias] = path.resolve(
                projectPath,
                baseUrl,
                targetPath
              );
            }
          );

          console.log(`✅ Loaded path aliases from ${configFile}:`, aliases);
          return aliases;
        }
      } catch (error) {
        console.warn(`⚠️  Could not parse ${configFile}:`, error.message);
      }
    }
  }

  // Default fallback for Next.js
  console.log("⚠️  No config found, using default Next.js alias");
  return {
    "@": projectPath,
  };
}

/**
 * Analyzes project dependencies using Madge
 */
async function analyzeDependencies(projectPath, outputPath) {
  console.log("🚀 Starting dependency analysis with Madge...");
  console.log(`📂 Project: ${projectPath}`);

  try {
    // Check if project path exists
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project path does not exist: ${projectPath}`);
    }

    // Extract path aliases
    const aliases = extractPathAliases(projectPath);

    // Run Madge analysis with proper configuration
    const result = await madge(projectPath, {
      fileExtensions: ["js", "jsx", "ts", "tsx", "mjs", "cjs"],
      excludeRegExp: [
        /node_modules/,
        /\.next/,
        /dist/,
        /build/,
        /__tests__/,
        /\.test\./,
        /\.spec\./,
      ],
      // Pass webpack config as a proper configuration object
      webpackConfig: {
        resolve: {
          alias: aliases,
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json", ".mjs", ".cjs"],
        },
      },
      // Additional configuration
      baseDir: projectPath,
      includeNpm: false,
    });

    const dependencyGraph = result.obj();
    const circularDependencies = result.circular();
    const warnings = result.warnings() || [];

    console.log(`✅ Analyzed ${Object.keys(dependencyGraph).length} files`);
    console.log(
      `⚠️  Found ${circularDependencies.length} circular dependencies`
    );

    if (warnings.length > 0) {
      console.log(`⚠️  ${warnings.length} warnings`);
    }

    // Convert to our format with absolute paths
    const dependencyMap = convertToDependencyMap(dependencyGraph, projectPath);

    // Prepare output
    const output = {
      metadata: {
        analyzedAt: new Date().toISOString(),
        projectRoot: projectPath,
        totalFiles: Object.keys(dependencyMap).length,
        circularDependenciesCount: circularDependencies.length,
      },
      dependencyMap,
      circularDependencies,
      warnings,
      stats: calculateStats(dependencyMap),
    };

    // Write to file
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`📝 Results written to: ${outputPath}`);

    // Print summary
    printSummary(output);

    return output;
  } catch (error) {
    console.error("❌ Analysis failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Converts Madge's graph format to our dependency map
 */
function convertToDependencyMap(madgeGraph, projectRoot) {
  const dependencyMap = {};

  // Pass 1: Create entries for all files
  Object.keys(madgeGraph).forEach((relativePath) => {
    const absolutePath = path.resolve(projectRoot, relativePath);

    dependencyMap[absolutePath] = {
      id: absolutePath,
      name: path.basename(absolutePath),
      relativePath: relativePath,
      type: "file",
      extension: path.extname(absolutePath),
      fullPath: absolutePath,
      imports: [],
      importedBy: [],
    };
  });

  // Pass 2: Populate imports and importedBy
  Object.entries(madgeGraph).forEach(([sourceRelPath, dependencies]) => {
    const sourceAbsPath = path.resolve(projectRoot, sourceRelPath);

    if (!dependencyMap[sourceAbsPath]) return;

    dependencies.forEach((depRelPath) => {
      const depAbsPath = path.resolve(projectRoot, depRelPath);

      // Add to source's imports
      if (dependencyMap[depAbsPath]) {
        dependencyMap[sourceAbsPath].imports.push({
          name: path.basename(depAbsPath),
          resolvedPath: depAbsPath,
          relativePath: depRelPath,
          isLocal: true,
          exists: true,
          type: "import",
        });

        // Add to target's importedBy
        dependencyMap[depAbsPath].importedBy.push({
          source: sourceAbsPath,
          name: path.basename(sourceAbsPath),
          relativePath: sourceRelPath,
          fullPath: sourceAbsPath,
          type: "import",
        });
      }
    });
  });

  return dependencyMap;
}

/**
 * Calculate statistics about the dependency map
 */
function calculateStats(dependencyMap) {
  const files = Object.values(dependencyMap);

  // Most imported files
  const mostImported = files
    .filter((f) => f.importedBy.length > 0)
    .sort((a, b) => b.importedBy.length - a.importedBy.length)
    .slice(0, 10)
    .map((f) => ({
      path: f.relativePath,
      name: f.name,
      importedByCount: f.importedBy.length,
    }));

  // Files with most dependencies
  const mostDependencies = files
    .filter((f) => f.imports.length > 0)
    .sort((a, b) => b.imports.length - a.imports.length)
    .slice(0, 10)
    .map((f) => ({
      path: f.relativePath,
      name: f.name,
      importsCount: f.imports.length,
    }));

  // Orphan files (not imported by anyone)
  const orphanFiles = files
    .filter((f) => f.importedBy.length === 0)
    .map((f) => ({
      path: f.relativePath,
      name: f.name,
    }));

  // Files by extension
  const filesByExtension = {};
  files.forEach((f) => {
    const ext = f.extension || "no-extension";
    filesByExtension[ext] = (filesByExtension[ext] || 0) + 1;
  });

  return {
    totalFiles: files.length,
    totalDependencies: files.reduce((sum, f) => sum + f.imports.length, 0),
    averageDependenciesPerFile:
      files.length > 0
        ? (
            files.reduce((sum, f) => sum + f.imports.length, 0) / files.length
          ).toFixed(2)
        : 0,
    mostImportedFiles: mostImported,
    mostDependentFiles: mostDependencies,
    orphanFiles: orphanFiles.slice(0, 20),
    orphanCount: orphanFiles.length,
    filesByExtension,
  };
}

/**
 * Prints a summary to the console
 */
function printSummary(output) {
  const { stats, circularDependencies } = output;

  console.log("\n📊 Analysis Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Total Files: ${stats.totalFiles}`);
  console.log(`Total Dependencies: ${stats.totalDependencies}`);
  console.log(`Average Dependencies/File: ${stats.averageDependenciesPerFile}`);
  console.log(`Orphan Files: ${stats.orphanCount}`);
  console.log(`Circular Dependencies: ${circularDependencies.length}`);

  console.log("\n📈 Files by Extension:");
  Object.entries(stats.filesByExtension)
    .sort((a, b) => b[1] - a[1])
    .forEach(([ext, count]) => {
      console.log(`  ${ext}: ${count}`);
    });

  if (stats.mostImportedFiles.length > 0) {
    console.log("\n🔥 Most Imported Files:");
    stats.mostImportedFiles.slice(0, 5).forEach((file, i) => {
      console.log(
        `  ${i + 1}. ${file.path} (imported ${file.importedByCount} times)`
      );
    });
  }

  if (stats.mostDependentFiles.length > 0) {
    console.log("\n📦 Files with Most Dependencies:");
    stats.mostDependentFiles.slice(0, 5).forEach((file, i) => {
      console.log(
        `  ${i + 1}. ${file.path} (imports ${file.importsCount} files)`
      );
    });
  }

  if (circularDependencies.length > 0) {
    console.log("\n⚠️  Circular Dependencies Found:");
    circularDependencies.slice(0, 3).forEach((cycle, i) => {
      console.log(`  ${i + 1}. ${cycle.join(" → ")}`);
    });
    if (circularDependencies.length > 3) {
      console.log(`  ... and ${circularDependencies.length - 3} more`);
    }
  }

  console.log("\n✅ Analysis complete!");
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(
    "Usage: node analyze-dependencies.js <project-path> [output-file]"
  );
  console.error(
    "Example: node analyze-dependencies.js /Users/rkg/my-project ./output.json"
  );
  process.exit(1);
}

const projectPath = path.resolve(args[0]);
const outputPath = args[1]
  ? path.resolve(args[1])
  : path.join(process.cwd(), "dependency-analysis.json");

analyzeDependencies(projectPath, outputPath);
