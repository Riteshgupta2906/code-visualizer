import fs from "fs";
import path from "path";
import crypto from "crypto";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import { file } from "@babel/types";

/**
 * Generates a unique ID for a dependency based on its characteristics
 */
function generateDependencyId(source, type, currentFilePath) {
  const data = `${source}-${type}-${currentFilePath}`;
  return crypto.createHash("md5").update(data).digest("hex").substring(0, 12);
}

/**
 * Generates a shorter unique ID for UI purposes
 */
function generateShortId() {
  return crypto.randomBytes(6).toString("hex");
}

/**
 * Analyzes dependencies in a JavaScript/TypeScript file
 * Returns a structured list of all imports and their resolved paths
 */
export function analyzeDependencies(filePath, projectRoot) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const fileExtension = path.extname(filePath);
    //console.log(fileExtension, fileContent);

    // Skip non-JavaScript/TypeScript files
    const supportedExtensions = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];
    if (!supportedExtensions.includes(fileExtension)) {
      return {
        localDependencies: [],
        externalDependencies: [],
        metadata: {
          totalCount: 0,
          parseErrors: [`Unsupported file type: ${fileExtension}`],
          filePath,
          analysisId: generateShortId(),
        },
      };
    }

    // Parse the file content into an AST
    const ast = parseFileContent(fileContent, fileExtension);
    // console.log(ast);

    // Extract all import/require statements
    const dependencies = extractDependencies(ast, filePath, projectRoot);

    return dependencies;
  } catch (error) {
    return {
      localDependencies: [],
      externalDependencies: [],
      metadata: {
        totalCount: 0,
        parseErrors: [error.message],
        filePath,
        analysisId: generateShortId(),
      },
    };
  }
}

/**
 * Parses file content into AST using Babel parser
 */
function parseFileContent(content, fileExtension) {
  const isTypeScript = [".ts", ".tsx"].includes(fileExtension);
  const isJSX = [".js", ".jsx"].includes(fileExtension);

  const parserOptions = {
    sourceType: "module",
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    plugins: [
      "asyncGenerators",
      "bigInt",
      "classProperties",
      "decorators-legacy",
      "doExpressions",
      "dynamicImport",
      "exportDefaultFrom",
      "exportNamespaceFrom",
      "functionSent",
      "functionBind",
      "importMeta",
      "nullishCoalescingOperator",
      "numericSeparator",
      "objectRestSpread",
      "optionalCatchBinding",
      "optionalChaining",
      "throwExpressions",
      "topLevelAwait",
      "trailingFunctionCommas",
    ],
  };

  if (isTypeScript) {
    parserOptions.plugins.push("typescript");
  }

  if (isJSX) {
    parserOptions.plugins.push("jsx");
  }

  return parse(content, parserOptions);
}

/**
 * Traverses AST and extracts all import/require dependencies
 */
function extractDependencies(ast, currentFilePath, projectRoot) {
  const dependencies = new Set();
  const currentDir = path.dirname(currentFilePath);

  traverse(ast, {
    // ES6 Imports: import x from 'module'
    ImportDeclaration(path) {
      const source = path.node.source.value;
      const depInfo = {
        source,
        type: "import",
        importKind: path.node.importKind || "value",
        specifiers: path.node.specifiers.map((spec) => ({
          type: spec.type,
          local: spec.local?.name,
          imported: spec.imported?.name || spec.local?.name,
          id: generateShortId(), // Add unique ID for each specifier
        })),
        id: generateDependencyId(source, "import", currentFilePath),
        nodeId: generateShortId(), // Unique ID for React Flow node
      };
      dependencies.add(depInfo);
    },

    // Dynamic Imports: import('module')
    CallExpression(path) {
      if (
        path.node.callee.type === "Import" &&
        path.node.arguments.length > 0
      ) {
        const source = path.node.arguments[0];
        if (source.type === "StringLiteral") {
          const depInfo = {
            source: source.value,
            type: "dynamic-import",
            importKind: "value",
            specifiers: [],
            id: generateDependencyId(
              source.value,
              "dynamic-import",
              currentFilePath
            ),
            nodeId: generateShortId(),
          };
          dependencies.add(depInfo);
        }
      }

      // CommonJS require: require('module')
      if (
        path.node.callee.type === "Identifier" &&
        path.node.callee.name === "require" &&
        path.node.arguments.length > 0
      ) {
        const source = path.node.arguments[0];
        if (source.type === "StringLiteral") {
          const depInfo = {
            source: source.value,
            type: "require",
            importKind: "value",
            specifiers: [],
            id: generateDependencyId(source.value, "require", currentFilePath),
            nodeId: generateShortId(),
          };
          dependencies.add(depInfo);
        }
      }
    },

    // Export from: export { x } from 'module'
    ExportNamedDeclaration(path) {
      if (path.node.source) {
        const source = path.node.source.value;
        const depInfo = {
          source,
          type: "export-from",
          importKind: "value",
          specifiers:
            path.node.specifiers?.map((spec) => ({
              type: spec.type,
              local: spec.local?.name,
              exported: spec.exported?.name,
              id: generateShortId(),
            })) || [],
          id: generateDependencyId(source, "export-from", currentFilePath),
          nodeId: generateShortId(),
        };
        dependencies.add(depInfo);
      }
    },

    // Export all from: export * from 'module'
    ExportAllDeclaration(path) {
      if (path.node.source) {
        const source = path.node.source.value;
        const depInfo = {
          source: source.value,
          type: "export-all-from",
          importKind: "value",
          specifiers: [],
          id: generateDependencyId(source, "export-all-from", currentFilePath),
          nodeId: generateShortId(),
        };
        dependencies.add(depInfo);
      }
    },
  });

  // Process and categorize dependencies
  return categorizeDependencies(
    Array.from(dependencies),
    currentDir,
    projectRoot
  );
}

/**
 * Categorizes dependencies into local and external
 */
function categorizeDependencies(dependencies, currentDir, projectRoot) {
  const localDependencies = [];
  const externalDependencies = [];
  const parseErrors = [];

  dependencies.forEach((dep) => {
    try {
      const resolvedInfo = resolveDependencyPath(
        dep.source,
        currentDir,
        projectRoot
      );

      const dependencyInfo = {
        name: dep.source,
        type: dep.type,
        importKind: dep.importKind,
        specifiers: dep.specifiers,
        id: dep.id, // Stable hash-based ID
        nodeId: dep.nodeId, // Unique ID for React Flow
        uiId: generateShortId(), // Additional UI-specific ID
        ...resolvedInfo,
      };

      if (resolvedInfo.isLocal) {
        localDependencies.push(dependencyInfo);
      } else {
        externalDependencies.push(dependencyInfo);
      }
    } catch (error) {
      parseErrors.push(`Failed to resolve ${dep.source}: ${error.message}`);
    }
  });

  return {
    localDependencies: localDependencies.sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    externalDependencies: externalDependencies.sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    metadata: {
      totalCount: localDependencies.length + externalDependencies.length,
      parseErrors,
      filePath: currentDir,
      analysisId: generateShortId(),
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Resolves dependency path and determines if it's local or external
 */
function resolveDependencyPath(importPath, currentDir, projectRoot) {
  // Check if it's a relative import
  if (importPath.startsWith(".")) {
    const resolvedPath = path.resolve(currentDir, importPath);
    const actualFilePath = findActualFile(resolvedPath);

    return {
      resolvedPath: actualFilePath || resolvedPath,
      isLocal: true,
      exists: !!actualFilePath,
      relativePath: path.relative(projectRoot, actualFilePath || resolvedPath),
      pathId: crypto
        .createHash("md5")
        .update(actualFilePath || resolvedPath)
        .digest("hex")
        .substring(0, 8),
    };
  }

  // Check if it's a Next.js alias (@ or other configured aliases)
  if (importPath.startsWith("@/")) {
    const aliasPath = importPath.replace("@/", "");
    const resolvedPath = path.resolve(projectRoot, aliasPath);
    const actualFilePath = findActualFile(resolvedPath);

    return {
      resolvedPath: actualFilePath || resolvedPath,
      isLocal: true,
      exists: !!actualFilePath,
      relativePath: path.relative(projectRoot, actualFilePath || resolvedPath),
      isAlias: true,
      pathId: crypto
        .createHash("md5")
        .update(actualFilePath || resolvedPath)
        .digest("hex")
        .substring(0, 8),
    };
  }

  // Check for other possible project-relative paths
  const possibleProjectPath = path.resolve(projectRoot, importPath);
  if (
    fs.existsSync(possibleProjectPath) ||
    findActualFile(possibleProjectPath)
  ) {
    const actualFilePath = findActualFile(possibleProjectPath);
    return {
      resolvedPath: actualFilePath || possibleProjectPath,
      isLocal: true,
      exists: !!actualFilePath,
      relativePath: path.relative(
        projectRoot,
        actualFilePath || possibleProjectPath
      ),
      pathId: crypto
        .createHash("md5")
        .update(actualFilePath || possibleProjectPath)
        .digest("hex")
        .substring(0, 8),
    };
  }

  // External dependency (npm package, built-in module, etc.)
  return {
    resolvedPath: importPath,
    isLocal: false,
    exists: null, // We don't check external package existence
    packageName: extractPackageName(importPath),
    packageId: crypto
      .createHash("md5")
      .update(extractPackageName(importPath))
      .digest("hex")
      .substring(0, 8),
  };
}

/**
 * Attempts to find the actual file by trying different extensions
 */
function findActualFile(basePath) {
  const extensions = [
    "",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".mjs",
    ".cjs",
  ];
  const indexFiles = ["/index.js", "/index.jsx", "/index.ts", "/index.tsx"];

  // Try the exact path with various extensions
  for (const ext of extensions) {
    const fullPath = basePath + ext;
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
  }

  // Try index files if the path is a directory
  if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
    for (const indexFile of indexFiles) {
      const fullPath = basePath + indexFile;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  return null;
}

/**
 * Extracts package name from import path (handles scoped packages)
 */
function extractPackageName(importPath) {
  // Handle scoped packages like @next/router/something -> @next/router
  if (importPath.startsWith("@")) {
    const parts = importPath.split("/");
    return parts.slice(0, 2).join("/");
  }

  // Handle regular packages like react/dom -> react
  return importPath.split("/")[0];
}

/**
 * Creates dependency nodes for the React Flow visualization
 */
export function createDependencyNodes(
  dependencies,
  parentFileNodeId,
  parentPosition
) {
  const nodes = [];
  const edges = [];

  const { localDependencies, externalDependencies } = dependencies;
  const allDeps = [...localDependencies, ...externalDependencies];

  // Position dependencies in a grid below the parent file
  const startY = parentPosition.y + 200;
  const nodeSpacing = 250;
  const rowSize = 4; // Max dependencies per row

  allDeps.forEach((dep, index) => {
    const row = Math.floor(index / rowSize);
    const col = index % rowSize;

    const x = parentPosition.x + (col - rowSize / 2) * nodeSpacing;
    const y = startY + row * 150;

    // Use the dependency's unique nodeId instead of index-based ID
    const nodeId = `${parentFileNodeId}-dep-${dep.nodeId}`;

    // Create dependency node
    const dependencyNode = {
      id: nodeId,
      type: "dependency",
      position: { x, y },
      data: {
        name: dep.name,
        type: "dependency",
        dependencyInfo: dep,
        isLocal: dep.isLocal,
        exists: dep.exists,
        resolvedPath: dep.resolvedPath,
        packageName: dep.packageName,
        importType: dep.type,
        specifiers: dep.specifiers,
        dependencyId: dep.id, // Stable hash-based ID
        nodeId: dep.nodeId, // Unique node ID
        uiId: dep.uiId, // UI-specific ID
      },
      draggable: true,
    };

    nodes.push(dependencyNode);

    // Create edge from parent file to dependency using unique IDs
    const edgeId = `edge-${parentFileNodeId}-${dep.nodeId}`;
    const edge = {
      id: edgeId,
      source: parentFileNodeId,
      target: nodeId,
      type: "smoothstep",
      style: {
        stroke: dep.isLocal ? "#10b981" : "#6366f1",
        strokeWidth: 2,
        strokeDasharray: dep.isLocal ? "0" : "5,5",
      },
      label: dep.type,
      data: {
        dependencyId: dep.id,
        edgeId: crypto
          .createHash("md5")
          .update(edgeId)
          .digest("hex")
          .substring(0, 8),
      },
    };

    edges.push(edge);
  });

  return { nodes, edges };
}

/**
 * Helper function to get dependency by ID
 */
export function getDependencyById(dependencies, dependencyId) {
  const { localDependencies, externalDependencies } = dependencies;
  const allDeps = [...localDependencies, ...externalDependencies];
  return allDeps.find((dep) => dep.id === dependencyId);
}

/**
 * Helper function to filter dependencies by type
 */
export function filterDependenciesByType(dependencies, type) {
  const { localDependencies, externalDependencies } = dependencies;
  const allDeps = [...localDependencies, ...externalDependencies];
  return allDeps.filter((dep) => dep.type === type);
}
