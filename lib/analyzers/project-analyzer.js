import fs from "fs";
import path from "path";
import ignore from "ignore";
import simpleGit from "simple-git";
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
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("model ")) {
        analysis.stats.models++;
        const match = trimmed.match(/^model\s+(\w+)/);
        if (match) analysis.modelNames.push(match[1]);
      }
      if (trimmed.startsWith("enum ")) analysis.stats.enums++;
      if (trimmed.includes("provider") && trimmed.includes("=")) {
        if (trimmed.includes("datasource")) {
          const match = trimmed.match(/provider\s*=\s*["'](\w+)["']/);
          if (match) analysis.stats.datasource.provider = match[1];
        }
      }
    });

    return analysis;
  } catch (error) {
    return null;
  }
}

function detectPrismaSchemas(projectPath) {
  const prismaInfo = { detected: false, schemas: [] };
  const prismaFolderPath = path.join(projectPath, "prisma");

  if (
    fs.existsSync(prismaFolderPath) &&
    fs.statSync(prismaFolderPath).isDirectory()
  ) {
    prismaInfo.detected = true;
    const items = fs.readdirSync(prismaFolderPath);
    items.forEach((item) => {
      if (item.endsWith(".prisma")) {
        const fullPath = path.join(prismaFolderPath, item);
        const analysis = analyzePrismaSchema(fullPath);
        if (analysis) prismaInfo.schemas.push(analysis);
      }
    });
  }
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
  madgeGraph = {}
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

  const isAppRouter = isAppRouterFolder(dirPath, rootPath);

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
            madgeGraph
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
      // Madge keys are relative paths
      // Look up dependencies in Madge graph (now Babel graph)
      // Graph keys are relative paths from project root
      const deps = madgeGraph[relativePath] || [];

      deps.forEach((depPath) => {
        const absPath = path.resolve(rootPath, depPath);
        const exists = fs.existsSync(absPath) && fs.statSync(absPath).isFile();
        
        // Determine if it's local
        // 1. If it exists on disk inside project, it's local.
        // 2. If it implies a path (./, ../, @/, ~/) but doesn't exist, it's a broken local link.
        // 3. Otherwise (bare specifier), it's external.
        
        let isLocal = false;
        
        if (exists) {
            isLocal = true;
        } else {
            if (depPath.startsWith(".") || depPath.startsWith("/") || depPath.startsWith("@/") || depPath.startsWith("~")) {
                isLocal = true;
            }
        }
        
        // Exclude truly external deps from being marked local if they happen to resolve (unlikely for bare specifiers unless folder matches)
        // But for safety, bare specifiers like "react" won't match checking absPath usually unless 'react' folder exists in root.

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
            exists: true, // Assume external packages exist
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
  const dependencyMap = {};

  // 1. Run Madge Analysis first
  console.log("🔍 Running Madge dependency analysis...");
  const madgeGraph = await analyzeProjectDependencies(projectPath);

  console.log("📂 Scanning project structure...");
  const structure = buildDirectoryTree(
    projectPath,
    ignorer,
    projectPath,
    "",
    dependencyMap,
    madgeGraph // Pass the graph
  );

  if (structure) structure.projectRoot = projectPath;

  console.log(`📊 Found ${Object.keys(dependencyMap).length} script files`);

  console.log("🔄 Computing reverse dependencies...");
  computeReverseDependencies(dependencyMap);

  console.log("📈 Generating insights...");
  const insights = analyzeProjectInsights(structure, dependencyMap);
  const prismaInfo = detectPrismaSchemas(projectPath);
  
  console.log("🌲 Extracting Git Info...");
  const gitInfo = await extractGitInfo(projectPath);

  console.log("✅ Analysis complete!");

  return {
    structure,
    dependencyMap,
    insights,
    prismaInfo,
    gitInfo,
    metadata: {
      analyzedAt: new Date().toISOString(),
      projectRoot: projectPath,
      totalFiles: Object.keys(dependencyMap).length,
    },
  };
}
