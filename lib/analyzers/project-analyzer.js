import fs from "fs";
import path from "path";
import ignore from "ignore";
import simpleGit from "simple-git";
import crypto from "crypto";
import { analyzeProjectDependencies } from "./dependency-analyzer.js";

// ==========================================
// PART 1: UTILITY & SPECIFIC ANALYZERS
// ==========================================

function extractAPIMethodsFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const fileContent = fs.readFileSync(filePath, "utf8");
    const methodPatterns = [
      /export\s+(async\s+)?function\s+GET\s*\(/gi,
      /export\s+(async\s+)?function\s+POST\s*\(/gi,
      /export\s+(async\s+)?function\s+PUT\s*\(/gi,
      /export\s+(async\s+)?function\s+DELETE\s*\(/gi,
      /export\s+(async\s+)?function\s+PATCH\s*\(/gi,
      /export\s+(async\s+)?function\s+HEAD\s*\(/gi,
      /export\s+(async\s+)?function\s+OPTIONS\s*\(/gi,
    ];
    const methodNames = [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "HEAD",
      "OPTIONS",
    ];

    const methods = [];
    methodPatterns.forEach((pattern, index) => {
      if (pattern.test(fileContent)) methods.push(methodNames[index]);
    });
    return methods.sort();
  } catch (error) {
    console.error("Error reading API file:", error);
    return [];
  }
}


function analyzePrismaSchema(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;

    const fileContent = fs.readFileSync(filePath, "utf8");
    const lines = fileContent.split("\n");
    const stats = fs.statSync(filePath);

    const analysis = {
      fileName: path.basename(filePath),
      filePath: filePath,
      fileSize: `${(stats.size / 1024).toFixed(2)} KB`,
      stats: {
        models: 0,
        enums: 0,
        datasource: { provider: null },
        generators: [],
        relationships: { total: 0 },
      },
      modelNames: [],
      hasSchemaFolder: false, // New flag
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("model ")) {
        analysis.stats.models++;
        const match = trimmed.match(/^model\s+(\w+)/);
        if (match) analysis.modelNames.push(match[1]);
      }
      if (trimmed.startsWith("enum ")) analysis.stats.enums++;
      
      // Datasource detection
      if (trimmed.includes("provider") && trimmed.includes("=")) {
        if (trimmed.includes("datasource")) {
          const match = trimmed.match(/provider\s*=\s*["'](\w+)["']/);
          if (match) analysis.stats.datasource.provider = match[1];
        }
      }

      // Generator detection & previewFeatures
      if (trimmed.includes("previewFeatures")) {
         if (trimmed.includes("prismaSchemaFolder")) {
             analysis.hasSchemaFolder = true;
         }
      }
    });

    return analysis;
  } catch (error) {
    return null;
  }
}

function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return crypto.createHash("sha256").update(content).digest("hex");
  } catch (error) {
    console.error(`Error hashing file ${filePath}:`, error);
    return null;
  }
}

function isValidPrismaSchema(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for Prisma keywords
    const hasGenerator = /generator\s+\w+\s*\{/.test(content);
    const hasDatasource = /datasource\s+\w+\s*\{/.test(content);
    const hasModel = /model\s+\w+\s*\{/.test(content);
    const hasEnum = /enum\s+\w+\s*\{/.test(content);
    
    // Valid if has at least datasource, model, or enum
    return hasDatasource || hasModel || hasEnum;
  } catch (error) {
    return false;
  }
}

function findPrismaFilesInProject(dirPath, ignorer, rootPath, files = [], depth = 0, maxDepth = 20) {
  // Prevent infinite recursion
  if (depth > maxDepth) return files;

  try {
    const relativePath = path.relative(rootPath, dirPath);
    
    // Skip ignored directories
    if (relativePath && ignorer.ignores(relativePath)) {
      return files;
    }

    const items = fs.readdirSync(dirPath);

    items.forEach((item) => {
      const fullPath = path.join(dirPath, item);
      
      try {
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Recursively search subdirectories
          findPrismaFilesInProject(fullPath, ignorer, rootPath, files, depth + 1, maxDepth);
        } else if (item.endsWith(".prisma")) {
          // Validate it's a real Prisma schema file
          if (isValidPrismaSchema(fullPath)) {
            files.push(fullPath);
          }
        }
      } catch (err) {
        // Skip files/folders we can't access
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return files;
}

function detectPrismaSchemas(projectPath, ignorer) {
  console.log("🔍 Searching for Prisma schema files...");
  
  const prismaInfo = {
    detected: false,
    schemas: [],
    duplicates: [],
    locations: [], // Track unique parent folders
  };

  // Find all .prisma files in the entire project
  const allPrismaFiles = findPrismaFilesInProject(projectPath, ignorer, projectPath);

  if (allPrismaFiles.length === 0) {
    console.log("❌ No Prisma schema files found");
    return prismaInfo;
  }

  console.log(`✅ Found ${allPrismaFiles.length} Prisma schema file(s)`);
  prismaInfo.detected = true;

  // Process files to detect Schema Folder feature
  const processingMap = new Map(); // path -> analysis
  const schemaFolders = new Set(); // paths of folders using prismaSchemaFolder

  allPrismaFiles.forEach(filePath => {
      const analysis = analyzePrismaSchema(filePath);
      if (analysis) {
          processingMap.set(filePath, analysis);
          if (analysis.hasSchemaFolder) {
              schemaFolders.add(path.dirname(filePath));
          }
      }
  });

  // Second pass: Group by folder if schema folder is active
  const processedFolders = new Set();
  const seenHashes = new Map(); // hash -> first file path
  const uniqueLocations = new Set();

  allPrismaFiles.forEach((filePath) => {
    const dirPath = path.dirname(filePath);
    
    // If this file belongs to a schema folder we haven't processed yet
    if (schemaFolders.has(dirPath)) {
        if (!processedFolders.has(dirPath)) {
            // Process the entire folder as one schema
            processedFolders.add(dirPath);
            
            // Collect all prisma files in this folder
            const filesInFolder = allPrismaFiles
                .filter(f => path.dirname(f) === dirPath)
                .map(f => ({
                    fileName: path.basename(f),
                    filePath: f
                }));
            
            // Aggregate stats
            const aggregatedStats = {
                models: 0,
                enums: 0,
                datasource: { provider: null },
                relationships: { total: 0 }
            };
            const modelNames = [];
            
            filesInFolder.forEach(f => {
                const a = processingMap.get(f.filePath);
                if (a) {
                    aggregatedStats.models += a.stats.models;
                    aggregatedStats.enums += a.stats.enums;
                    if (a.stats.datasource.provider) aggregatedStats.datasource.provider = a.stats.datasource.provider;
                    modelNames.push(...a.modelNames);
                }
            });

            const relativePath = path.relative(projectPath, dirPath);
            uniqueLocations.add(dirPath);

            prismaInfo.schemas.push({
                fileName: path.basename(dirPath) + " (Schema Folder)",
                filePath: dirPath, // Pointing to the FOLDER
                fileSize: "N/A",
                stats: aggregatedStats,
                modelNames: modelNames,
                isSchemaFolder: true,
                files: filesInFolder,
                location: dirPath,
            });
            console.log(`✅ Identified Schema Folder: ${dirPath}`);
        }
    } else {
        // Standard single file schema processing
        const hash = getFileHash(filePath);
        if (!hash) return; 

        if (seenHashes.has(hash)) {
            prismaInfo.duplicates.push({
                originalPath: seenHashes.get(hash),
                duplicatePath: filePath,
            });
        } else {
            seenHashes.set(hash, filePath);
            const analysis = processingMap.get(filePath);
            if (analysis) {
                const relativePath = path.relative(projectPath, filePath);
                const location = path.dirname(relativePath);
                uniqueLocations.add(location);
                
                prismaInfo.schemas.push({
                    ...analysis,
                    hash,
                    location,
                });
            }
        }
    }
  });

  prismaInfo.locations = Array.from(uniqueLocations).sort();
  console.log(`📊 Prisma schemas found in: ${prismaInfo.locations.join(', ')}`);

  return prismaInfo;
}


// ==========================================
// PART 1.5: GIT INFO ANALYZER
// ==========================================

async function extractGitInfo(projectPath) {
  try {
    const git = simpleGit(projectPath);
    const isRepo = await git.checkIsRepo();

    if (!isRepo) {
      return null;
    }

    const log = await git.log({ maxCount: 1 });
    const status = await git.status();
    const branch = await git.branch();
    const remotes = await git.getRemotes(true);

    const latestCommit = log.latest
      ? {
          hash: log.latest.hash,
          date: log.latest.date,
          message: log.latest.message,
          author_name: log.latest.author_name,
          author_email: log.latest.author_email,
        }
      : null;

    return {
      isRepo: true,
      currentBranch: branch.current,
      remotes: remotes.map((r) => ({ name: r.name, url: r.refs.fetch })),
      latestCommit,
      status: {
        modified: status.modified.length,
        deleted: status.deleted.length,
        created: status.created.length,
        conflicted: status.conflicted.length,
      },
    };
  } catch (error) {
    console.warn("Failed to extract git info:", error.message);
    return null;
  }
}

// ==========================================
// PART 1.75: APP FOLDER DISCOVERY
// ==========================================

function isValidAppRouterFolder(folderPath) {
  try {
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
      return false;
    }

    // Check for App Router special files (at least one should exist)
    const items = fs.readdirSync(folderPath);
    const appRouterIndicators = [
      'layout.js', 'layout.jsx', 'layout.ts', 'layout.tsx',
      'page.js', 'page.jsx', 'page.ts', 'page.tsx',
      'loading.js', 'loading.jsx', 'loading.ts', 'loading.tsx',
      'error.js', 'error.jsx', 'error.ts', 'error.tsx',
      'route.js', 'route.jsx', 'route.ts', 'route.tsx',
    ];

    const hasAppRouterFiles = items.some(item => appRouterIndicators.includes(item));
    return hasAppRouterFiles;
  } catch (error) {
    return false;
  }
}

function findAppFolderRecursively(dirPath, ignorer, rootPath, depth = 0, maxDepth = 10) {
  // Prevent infinite recursion
  if (depth > maxDepth) return null;

  try {
    const relativePath = path.relative(rootPath, dirPath);
    
    // Skip ignored directories
    if (relativePath && ignorer.ignores(relativePath)) {
      return null;
    }

    const items = fs.readdirSync(dirPath);

    // Check if current directory is named 'app' and is valid
    if (path.basename(dirPath) === 'app' && isValidAppRouterFolder(dirPath)) {
      return {
        found: true,
        absolutePath: dirPath,
        relativePath: relativePath || 'app',
        location: relativePath || 'app',
      };
    }

    // Search subdirectories
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const result = findAppFolderRecursively(fullPath, ignorer, rootPath, depth + 1, maxDepth);
          if (result && result.found) {
            return result;
          }
        }
      } catch (err) {
        // Skip files/folders we can't access
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error searching directory ${dirPath}:`, error);
    return null;
  }
}

function locateAppFolder(projectPath, ignorer) {
  console.log("🔍 Searching for App Router folder...");

  // First check common locations for performance
  const commonPaths = [
    path.join(projectPath, 'app'),
    path.join(projectPath, 'src', 'app'),
  ];

  for (const appPath of commonPaths) {
    if (isValidAppRouterFolder(appPath)) {
      const relativePath = path.relative(projectPath, appPath);
      console.log(`✅ Found App Router at: ${relativePath}`);
      return {
        found: true,
        absolutePath: appPath,
        relativePath: relativePath,
        location: relativePath,
      };
    }
  }

  // If not found in common locations, do recursive search
  console.log("🔍 App folder not in common locations, searching recursively...");
  const result = findAppFolderRecursively(projectPath, ignorer, projectPath);

  if (result && result.found) {
    console.log(`✅ Found App Router at: ${result.relativePath}`);
    return result;
  }

  console.log("❌ No valid App Router folder found");
  return {
    found: false,
    absolutePath: null,
    relativePath: null,
    location: null,
  };
}

// ==========================================
// PART 2: NEXT.JS APP ROUTER LOGIC
// ==========================================

function analyzeRoutingPattern(folderName) {
  if (folderName.startsWith("(") && folderName.endsWith(")"))
    return { type: "route-group", routingType: "Route Group" };
  if (folderName.startsWith("_"))
    return { type: "private-folder", routingType: "Private Folder" };
  if (folderName.startsWith("[") && folderName.endsWith("]")) {
    if (folderName.includes("..."))
      return { type: "catch-all", routingType: "Catch All" };
    return {
      type: "dynamic-route",
      routingType: "Dynamic Route",
      paramName: folderName.slice(1, -1),
    };
  }
  if (folderName.startsWith("@"))
    return { type: "parallel-route", routingType: "Parallel Route" };
  if (folderName.match(/^\(\.+\)/))
    return { type: "intercepting-route", routingType: "Intercepting Route" };

  return { type: "static-route", routingType: "Static Route" };
}

function analyzeAppRouterFile(fileName, filePath) {
  const name = fileName.split(".")[0];
  const validExts = [".js", ".jsx", ".ts", ".tsx"];
  if (!validExts.includes(path.extname(fileName))) return null;

  const specialFiles = [
    "layout",
    "page",
    "loading",
    "not-found",
    "error",
    "global-error",
    "route",
    "template",
    "default",
  ];

  if (specialFiles.includes(name)) {
    const analysis = {
      type: `${name}-file`,
      purpose: name,
      isAppRouterSpecial: true,
    };
    if (name === "route") {
      analysis.apiMethods = extractAPIMethodsFromFile(filePath);
    }
    return analysis;
  }
  return { type: "component-file", purpose: "Component" };
}

function isAppRouterFolder(folderPath, rootPath) {
  const relative = path.relative(rootPath, folderPath);
  return (
    relative.startsWith("app/") ||
    relative === "app" ||
    relative.includes(path.sep + "app" + path.sep)
  );
}

function getIgnorer(projectPath) {
  const ig = ignore();
  ig.add([
    "node_modules",
    ".next",
    ".git",
    "dist",
    "build",
    ".vscode",
    ".idea",
  ]);
  const gitignorePath = path.join(projectPath, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    try {
      ig.add(fs.readFileSync(gitignorePath, "utf8"));
    } catch (e) {
      console.warn("Could not read .gitignore", e);
    }
  }
  return ig;
}

// ==========================================
// PART 3: RECURSIVE SCANNER & GRAPH BUILDER
// ==========================================

function buildDirectoryTree(
  dirPath,
  ignorer,
  rootPath,
  parentRoutePath = "",
  dependencyMap = {},
  madgeGraph = {},
  appFolderPath = null
) {
  const relativePath = path.relative(rootPath, dirPath);

  if (relativePath && ignorer.ignores(relativePath)) return null;

  const name = path.basename(dirPath);
  let stats;
  try {
    stats = fs.statSync(dirPath);
  } catch (e) {
    return null;
  }

  // Check if this path is inside the app folder
  const isAppRouter = appFolderPath ? dirPath.startsWith(appFolderPath) : false;

  if (stats.isDirectory()) {
    let children = [];
    try {
      children = fs
        .readdirSync(dirPath)
        .map((child) => {
          return buildDirectoryTree(
            path.join(dirPath, child),
            ignorer,
            rootPath,
            isAppRouter ? `${parentRoutePath}/${name}` : "",
            dependencyMap,
            madgeGraph,
            appFolderPath
          );
        })
        .filter(Boolean);
    } catch (e) {
      console.warn(`Could not read directory ${dirPath}`, e);
    }

    return {
      type: "folder",
      name,
      fullPath: dirPath,
      relativePath: relativePath || name,
      isAppRouter,
      routingAnalysis: isAppRouter ? analyzeRoutingPattern(name) : null,
      children,
    };
  } else {
    const ext = path.extname(name);
    const isScript = [".js", ".jsx", ".ts", ".tsx", ".mjs"].includes(ext);

    let localDependencies = [];
    let externalDependencies = [];

    if (isScript) {
      // Look up dependencies in Madge graph
      const deps = madgeGraph[relativePath] || [];

      deps.forEach((depPath) => {
        const absPath = path.resolve(rootPath, depPath);
        const exists = fs.existsSync(absPath) && fs.statSync(absPath).isFile();
        
        let isLocal = false;
        
        if (exists) {
            isLocal = true;
        } else {
            if (depPath.startsWith(".") || depPath.startsWith("/") || depPath.startsWith("@/") || depPath.startsWith("~")) {
                isLocal = true;
            }
        }

        if (isLocal) {
          localDependencies.push({
            name: path.basename(depPath),
            resolvedPath: exists ? absPath : depPath,
            relativePath: exists ? path.relative(rootPath, absPath) : depPath,
            specifiers: [],
            exists: exists,
          });
        } else {
          externalDependencies.push({
            name: depPath,
            resolvedPath: depPath,
            specifiers: [],
            exists: true,
          });
        }
      });

      dependencyMap[dirPath] = {
        id: dirPath,
        name: name,
        relativePath: relativePath,
        type: "file",
        extension: ext,
        fullPath: dirPath,
        imports: localDependencies,
        externalImports: externalDependencies,
        importedBy: [],
      };
    }

    const appRouterAnalysis = isAppRouter
      ? analyzeAppRouterFile(name, dirPath)
      : null;

    return {
      type: "file",
      name,
      fullPath: dirPath,
      relativePath: relativePath,
      isAppRouter,
      fileAnalysis: appRouterAnalysis,
      dependencyStats: {
        localCount: localDependencies.length,
        externalCount: externalDependencies.length,
      },
    };
  }
}

function computeReverseDependencies(dependencyMap) {
  const allFiles = Object.values(dependencyMap);

  allFiles.forEach((sourceFile) => {
    sourceFile.imports.forEach((dependency) => {
      const targetPath = dependency.resolvedPath;
      if (dependencyMap[targetPath]) {
        dependencyMap[targetPath].importedBy.push({
          source: sourceFile.id,
          name: sourceFile.name,
          relativePath: sourceFile.relativePath,
          specifiers: dependency.specifiers,
        });
      }
    });
  });
}

function analyzeProjectInsights(structure, dependencyMap) {
  const insights = {
    totalFiles: Object.keys(dependencyMap).length,
    appRouterDetected: structure?.isAppRouter || false,
    routeCount: 0,
    apiEndpointCount: 0,
    routePatterns: {
      dynamic: 0,
      routeGroups: 0,
      parallel: 0,
      intercepting: 0,
    },
  };

  function traverse(node) {
    if (!node) return;

    // Check for App Router specific patterns
    if (node.isAppRouter) {
      if (node.type === "file") {
        if (node.fileAnalysis?.type === "page-file") {
          insights.routeCount++;
        }
        if (node.fileAnalysis?.type === "route-file") {
          insights.apiEndpointCount++;
        }
      }

       if (node.type === "folder" && node.routingAnalysis) {
        const type = node.routingAnalysis.type;
        if (type === "dynamic-route" || type === "catch-all") {
          insights.routePatterns.dynamic++;
        } else if (type === "route-group") {
          insights.routePatterns.routeGroups++;
        } else if (type === "parallel-route") {
          insights.routePatterns.parallel++;
        } else if (type === "intercepting-route") {
          insights.routePatterns.intercepting++;
        }
      }
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(structure);
  return insights;
}

// ==========================================
// PART 4: MAIN EXPORT
// ==========================================

export async function analyzeProject(projectPath) {
  console.log("🚀 Starting project analysis...");

  if (!fs.existsSync(projectPath) || !fs.statSync(projectPath).isDirectory()) {
    throw new Error(`Project path is not a valid directory: ${projectPath}`);
  }

  const ignorer = getIgnorer(projectPath);

  // 1. Locate the app folder first
  const appFolderInfo = locateAppFolder(projectPath, ignorer);

  if (!appFolderInfo.found) {
    return {
      success: false,
      error: "No App Router detected. This tool only works with Next.js App Router projects (requires an 'app' folder with layout or page files).",
      appFolderInfo,
      metadata: {
        analyzedAt: new Date().toISOString(),
        projectRoot: projectPath,
      }
    };
  }

  const dependencyMap = {};

  // 2. Run Madge Analysis on entire project (needed for dependencies)
  console.log("🔍 Running Madge dependency analysis...");
  const madgeGraph = await analyzeProjectDependencies(projectPath);

  // 3. Build directory tree ONLY for the app folder
  console.log("📂 Scanning App Router structure...");
  const structure = buildDirectoryTree(
    appFolderInfo.absolutePath,  // Start from app folder
    ignorer,
    projectPath,                 // Keep project root for relative paths
    "",
    dependencyMap,
    madgeGraph,
    appFolderInfo.absolutePath   // Pass app folder path for validation
  );

  if (structure) {
    structure.projectRoot = projectPath;
    structure.appFolderPath = appFolderInfo.absolutePath;
    structure.appFolderRelative = appFolderInfo.relativePath;
    // Mark the root structure as app router
    structure.isAppRouter = true;
  }

  console.log(`📊 Found ${Object.keys(dependencyMap).length} script files in app folder`);

  console.log("🔄 Computing reverse dependencies...");
  computeReverseDependencies(dependencyMap);

  console.log("📈 Generating insights...");
  const insights = analyzeProjectInsights(structure, dependencyMap);
  
  // Prisma detection - now searches entire project
  const prismaInfo = detectPrismaSchemas(projectPath, ignorer);
  
  console.log("🌲 Extracting Git Info...");
  const gitInfo = await extractGitInfo(projectPath);

  console.log("✅ Analysis complete!");

  return {
    success: true,
    structure,
    dependencyMap,
    insights,
    prismaInfo,
    gitInfo,
    appFolderInfo,
    metadata: {
      analyzedAt: new Date().toISOString(),
      projectRoot: projectPath,
      appRouterLocation: appFolderInfo.relativePath,
      totalFiles: Object.keys(dependencyMap).length,
    },
  };
}