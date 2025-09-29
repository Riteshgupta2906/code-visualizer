import fs from "fs";
import path from "path";

export async function parseAppRouter(appRouterPath) {
  const analysis = {
    routes: [],
    routeGroups: [],
    parallelRoutes: [],
    interceptingRoutes: [],
    apiRoutes: [],
    specialFiles: [],
    layouts: [],
    metadataFiles: [],
    configFiles: [],
    privatefolders: [],
    colocatedFiles: [],
    summary: {},
  };

  // Start recursive parsing from app directory
  await parseDirectory(appRouterPath, "", analysis);

  // Parse root-level config files
  await parseRootConfigFiles(path.dirname(appRouterPath), analysis);

  // Build route hierarchy and relationships
  buildRouteRelationships(analysis);

  // Generate summary statistics
  generateSummary(analysis);

  return analysis;
}

async function parseDirectory(
  dirPath,
  currentRoutePath,
  analysis,
  parentInfo = {}
) {
  if (!fs.existsSync(dirPath)) return;

  const items = fs.readdirSync(dirPath);
  const routeInfo = {
    path: currentRoutePath,
    fullPath: dirPath,
    children: [],
    specialFiles: {},
    metadataFiles: {},
    colocatedFiles: [],
    hasLayout: false,
    layoutPath: null,
    routeType: "regular",
    isPrivateFolder: false,
  };

  // Check if this is a private folder
  const folderName = path.basename(dirPath);
  if (folderName.startsWith("_")) {
    routeInfo.isPrivateFolder = true;
    analysis.privatefolders.push({
      name: folderName,
      path: currentRoutePath,
      fullPath: dirPath,
    });
  }

  // Process all items in current directory
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      await processDirectory(
        item,
        itemPath,
        currentRoutePath,
        analysis,
        routeInfo
      );
    } else if (stats.isFile()) {
      await processFile(item, itemPath, currentRoutePath, analysis, routeInfo);
    }
  }

  // Add route info if it has meaningful content
  if (hasRouteContent(routeInfo)) {
    analysis.routes.push(routeInfo);
  }

  return routeInfo;
}

async function processDirectory(
  dirName,
  dirPath,
  currentRoutePath,
  analysis,
  parentRouteInfo
) {
  let newRoutePath = currentRoutePath;
  let routeType = "regular";

  // Handle Route Groups (folder) - don't affect URL
  if (dirName.startsWith("(") && dirName.endsWith(")")) {
    routeType = "route-group";
    const groupName = dirName.slice(1, -1);

    analysis.routeGroups.push({
      name: groupName,
      path: currentRoutePath,
      fullPath: dirPath,
      routes: [],
    });

    // Route groups don't change the URL path
    newRoutePath = currentRoutePath;
  }

  // Handle Parallel Routes @folder
  else if (dirName.startsWith("@")) {
    routeType = "parallel";
    const slotName = dirName.slice(1);

    analysis.parallelRoutes.push({
      slot: slotName,
      path: currentRoutePath,
      fullPath: dirPath,
      parentPath: currentRoutePath,
    });

    // Parallel routes don't add to URL path
    newRoutePath = currentRoutePath;
  }

  // Handle Intercepting Routes (..)folder, (.)folder, (...)folder
  else if (
    dirName.startsWith("(") &&
    dirName.includes(".") &&
    dirName.endsWith(")")
  ) {
    routeType = "intercepting";
    const interceptInfo = parseInterceptingRoute(dirName);

    analysis.interceptingRoutes.push({
      pattern: interceptInfo.pattern,
      targetSegment: interceptInfo.segment,
      path: currentRoutePath,
      fullPath: dirPath,
      interceptLevel: interceptInfo.level,
    });

    newRoutePath = path
      .join(currentRoutePath, interceptInfo.segment)
      .replace(/\\/g, "/");
  }

  // Handle Dynamic Routes [param] and [...param]
  else if (dirName.startsWith("[") && dirName.endsWith("]")) {
    if (dirName.startsWith("[...")) {
      // Catch-all route
      routeType = "catch-all";
      const paramName = dirName.slice(4, -1);
      newRoutePath = path
        .join(currentRoutePath, `[...${paramName}]`)
        .replace(/\\/g, "/");
    } else if (dirName.startsWith("[[...") && dirName.endsWith("]]")) {
      // Optional catch-all route
      routeType = "optional-catch-all";
      const paramName = dirName.slice(5, -2);
      newRoutePath = path
        .join(currentRoutePath, `[[...${paramName}]]`)
        .replace(/\\/g, "/");
    } else {
      // Regular dynamic route
      routeType = "dynamic";
      const paramName = dirName.slice(1, -1);
      newRoutePath = path
        .join(currentRoutePath, `[${paramName}]`)
        .replace(/\\/g, "/");
    }
  }

  // Regular static route
  else {
    newRoutePath = path.join(currentRoutePath, dirName).replace(/\\/g, "/");
  }

  // Recursively parse the directory
  const childRouteInfo = await parseDirectory(dirPath, newRoutePath, analysis, {
    type: routeType,
    name: dirName,
    parentPath: currentRoutePath,
  });

  if (childRouteInfo) {
    childRouteInfo.routeType = routeType;
    parentRouteInfo.children.push(childRouteInfo);
  }
}

async function processFile(
  fileName,
  filePath,
  currentRoutePath,
  analysis,
  routeInfo
) {
  const fileBaseName = path.parse(fileName).name;
  const fileExtension = path.parse(fileName).ext;

  // Skip non-relevant files for parsing
  if (
    ![".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".json", ".mjs"].includes(
      fileExtension
    )
  ) {
    return;
  }

  // Handle special App Router files
  if (isSpecialAppRouterFile(fileBaseName)) {
    const specialFile = {
      type: fileBaseName,
      fileName,
      path: currentRoutePath,
      fullPath: filePath,
      routePath: currentRoutePath || "/",
      extension: fileExtension,
    };

    analysis.specialFiles.push(specialFile);
    routeInfo.specialFiles[fileBaseName] = specialFile;

    // Track layouts separately for inheritance mapping
    if (fileBaseName === "layout") {
      routeInfo.hasLayout = true;
      routeInfo.layoutPath = filePath;

      const layoutInfo = {
        path: currentRoutePath,
        fullPath: filePath,
        fileName,
        children: [],
        imports: await extractImports(filePath),
        exports: await extractExports(filePath),
      };

      analysis.layouts.push(layoutInfo);
    }

    // Track pages for route creation
    if (fileBaseName === "page") {
      routeInfo.isPage = true;
      routeInfo.pageFile = specialFile;
    }
  }

  // Handle metadata files
  else if (isMetadataFile(fileName)) {
    const metadataFile = {
      type: getMetadataType(fileName),
      fileName,
      path: currentRoutePath,
      fullPath: filePath,
      extension: fileExtension,
    };

    analysis.metadataFiles.push(metadataFile);
    routeInfo.metadataFiles[metadataFile.type] = metadataFile;
  }

  // Handle API routes
  else if (fileBaseName === "route") {
    const apiRoute = {
      path: currentRoutePath || "/",
      fullPath: filePath,
      fileName,
      methods: await extractApiMethods(filePath),
      middleware: await extractMiddleware(filePath),
      serverActions: await extractServerActions(filePath),
      routeType: determineApiRouteType(currentRoutePath),
    };

    analysis.apiRoutes.push(apiRoute);
  }

  // Handle global styles
  else if (fileName === "globals.css" || fileName === "global.css") {
    const globalStyle = {
      type: "global-styles",
      fileName,
      path: currentRoutePath,
      fullPath: filePath,
    };

    analysis.specialFiles.push(globalStyle);
  }

  // Handle co-located files (components, utilities, etc.)
  else if (isColocatedFile(fileName, fileExtension)) {
    const colocatedFile = {
      name: fileName,
      type: determineColocatedFileType(fileName, filePath),
      path: currentRoutePath,
      fullPath: filePath,
      extension: fileExtension,
    };

    analysis.colocatedFiles.push(colocatedFile);
    routeInfo.colocatedFiles.push(colocatedFile);
  }
}

function isSpecialAppRouterFile(fileName) {
  return [
    "layout",
    "page",
    "loading",
    "error",
    "not-found",
    "template",
    "default",
    "global-error",
  ].includes(fileName);
}

function isMetadataFile(fileName) {
  const metadataFiles = [
    "opengraph-image",
    "twitter-image",
    "icon",
    "apple-icon",
    "manifest",
    "sitemap",
    "robots",
    "favicon.ico",
  ];

  const baseName = path.parse(fileName).name;
  return metadataFiles.includes(baseName) || metadataFiles.includes(fileName);
}

function getMetadataType(fileName) {
  const baseName = path.parse(fileName).name;

  if (baseName.includes("opengraph")) return "opengraph-image";
  if (baseName.includes("twitter")) return "twitter-image";
  if (baseName === "icon") return "icon";
  if (baseName === "apple-icon") return "apple-icon";
  if (baseName === "manifest") return "manifest";
  if (baseName === "sitemap") return "sitemap";
  if (baseName === "robots") return "robots";
  if (fileName === "favicon.ico") return "favicon";

  return "metadata";
}

function isColocatedFile(fileName, extension) {
  const baseName = path.parse(fileName).name;

  // Skip special files and API routes
  if (
    isSpecialAppRouterFile(baseName) ||
    baseName === "route" ||
    isMetadataFile(fileName)
  ) {
    return false;
  }

  // Include component and utility files
  return [".js", ".jsx", ".ts", ".tsx"].includes(extension);
}

function determineColocatedFileType(fileName, filePath) {
  const baseName = path.parse(fileName).name.toLowerCase();

  if (baseName.includes("component") || baseName.endsWith("component")) {
    return "component";
  }

  if (baseName.includes("util") || baseName.includes("helper")) {
    return "utility";
  }

  if (baseName.includes("hook") || baseName.startsWith("use")) {
    return "hook";
  }

  if (baseName.includes("type") || baseName.includes("interface")) {
    return "types";
  }

  if (baseName.includes("constant") || baseName.includes("config")) {
    return "constants";
  }

  // Try to detect by analyzing file content
  try {
    const content = fs.readFileSync(filePath, "utf8");

    if (content.includes("export default") && content.includes("return")) {
      return "component";
    }

    if (content.includes("useState") || content.includes("useEffect")) {
      return "hook";
    }
  } catch (error) {
    // Ignore file read errors
  }

  return "module";
}

async function parseRootConfigFiles(projectRoot, analysis) {
  const configFiles = [
    "next.config.js",
    "next.config.mjs",
    "tailwind.config.js",
    "tailwind.config.ts",
    "middleware.ts",
    "middleware.js",
    "instrumentation.ts",
    "instrumentation.js",
  ];

  const envFiles = [
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.test",
  ];

  // Check for config files
  for (const configFile of configFiles) {
    const configPath = path.join(projectRoot, configFile);
    if (fs.existsSync(configPath)) {
      analysis.configFiles.push({
        type: getConfigFileType(configFile),
        fileName: configFile,
        fullPath: configPath,
        isRoot: true,
      });
    }
  }

  // Check for env files
  for (const envFile of envFiles) {
    const envPath = path.join(projectRoot, envFile);
    if (fs.existsSync(envPath)) {
      analysis.configFiles.push({
        type: "environment",
        fileName: envFile,
        fullPath: envPath,
        isRoot: true,
      });
    }
  }
}

function getConfigFileType(fileName) {
  if (fileName.includes("next.config")) return "next-config";
  if (fileName.includes("tailwind.config")) return "tailwind-config";
  if (fileName.includes("middleware")) return "middleware";
  if (fileName.includes("instrumentation")) return "instrumentation";
  return "config";
}

function parseInterceptingRoute(dirName) {
  // Examples: (.)photo, (..)settings, (...)modal
  const match = dirName.match(/^\((\.*)\)(.+)$/);
  if (!match) return { pattern: dirName, segment: dirName, level: 0 };

  const dots = match[1];
  const segment = match[2];

  let level = 0;
  if (dots === ".") level = 0; // Same level
  else if (dots === "..") level = 1; // One level up
  else if (dots === "...") level = 2; // Root level

  return {
    pattern: dirName,
    segment,
    level,
    description: getInterceptDescription(level),
  };
}

function getInterceptDescription(level) {
  switch (level) {
    case 0:
      return "Same level intercept";
    case 1:
      return "One level up intercept";
    case 2:
      return "Root level intercept";
    default:
      return "Unknown intercept";
  }
}

async function extractServerActions(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const serverActions = [];

    // Look for 'use server' directive
    if (content.includes("'use server'") || content.includes('"use server"')) {
      serverActions.push("server-actions");
    }

    // Look for server action patterns
    const serverActionRegex = /export\s+async\s+function\s+(\w+)/g;
    let match;
    while ((match = serverActionRegex.exec(content)) !== null) {
      if (
        content.includes("'use server'") ||
        content.includes('"use server"')
      ) {
        serverActions.push(match[1]);
      }
    }

    return serverActions;
  } catch (error) {
    return [];
  }
}

function determineApiRouteType(routePath) {
  if (routePath.includes("[") && routePath.includes("]")) {
    if (routePath.includes("[...")) return "catch-all-api";
    return "dynamic-api";
  }
  return "static-api";
}

async function extractApiMethods(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const methods = [];

    const httpMethods = [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "HEAD",
      "OPTIONS",
    ];

    for (const method of httpMethods) {
      const patterns = [
        new RegExp(`export\\s+async\\s+function\\s+${method}`, "g"),
        new RegExp(`export\\s+function\\s+${method}`, "g"),
        new RegExp(`export\\s+const\\s+${method}\\s*=`, "g"),
        new RegExp(`export\\s+{[^}]*${method}[^}]*}`, "g"),
      ];

      if (patterns.some((pattern) => pattern.test(content))) {
        methods.push(method);
      }
    }

    return methods.length > 0 ? methods : ["GET"];
  } catch (error) {
    return ["GET"];
  }
}

async function extractMiddleware(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const middleware = [];

    // Look for common middleware patterns
    if (content.includes("NextRequest") || content.includes("NextResponse")) {
      middleware.push("next-middleware");
    }

    if (content.includes("auth") || content.includes("Auth")) {
      middleware.push("authentication");
    }

    if (content.includes("cors") || content.includes("CORS")) {
      middleware.push("cors");
    }

    return middleware;
  } catch (error) {
    return [];
  }
}

async function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const imports = [];

    // Simple regex to find import statements
    const importRegex =
      /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*(?:{[^}]*}|\*\s+as\s+\w+|\w+))?\s*from\s+['"]([^'"]+)['"]/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  } catch (error) {
    return [];
  }
}

async function extractExports(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const exports = [];

    // Look for export patterns
    if (content.includes("export default")) {
      exports.push("default");
    }

    const namedExportRegex = /export\s+(?:const|function|class)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  } catch (error) {
    return [];
  }
}

function hasRouteContent(routeInfo) {
  return (
    routeInfo.isPage ||
    routeInfo.hasLayout ||
    routeInfo.children.length > 0 ||
    Object.keys(routeInfo.specialFiles).length > 0 ||
    Object.keys(routeInfo.metadataFiles).length > 0 ||
    routeInfo.colocatedFiles.length > 0 ||
    routeInfo.isPrivateFolder
  );
}

function buildRouteRelationships(analysis) {
  // Build layout inheritance chain
  buildLayoutInheritance(analysis);

  // Map parallel route relationships
  mapParallelRoutes(analysis);

  // Connect intercepting routes
  connectInterceptingRoutes(analysis);

  // Group API routes by functionality
  groupApiRoutes(analysis);
}

function buildLayoutInheritance(analysis) {
  const layoutsByPath = {};

  // Index layouts by path
  analysis.layouts.forEach((layout) => {
    layoutsByPath[layout.path] = layout;
  });

  // Build inheritance chain for each route
  analysis.routes.forEach((route) => {
    route.layoutChain = [];
    let currentPath = route.path;

    // Walk up the path hierarchy to find layouts
    while (currentPath !== null) {
      if (layoutsByPath[currentPath]) {
        route.layoutChain.unshift(layoutsByPath[currentPath]);
      }

      // Move to parent path
      if (currentPath === "" || currentPath === "/") {
        currentPath = null;
      } else {
        currentPath = path.dirname(currentPath);
        if (currentPath === ".") currentPath = "";
      }
    }
  });
}

function mapParallelRoutes(analysis) {
  // Group parallel routes by their parent path
  const parallelByParent = {};

  analysis.parallelRoutes.forEach((parallel) => {
    if (!parallelByParent[parallel.parentPath]) {
      parallelByParent[parallel.parentPath] = [];
    }
    parallelByParent[parallel.parentPath].push(parallel);
  });

  // Add parallel route info to regular routes
  analysis.routes.forEach((route) => {
    if (parallelByParent[route.path]) {
      route.parallelSlots = parallelByParent[route.path];
    }
  });
}

function connectInterceptingRoutes(analysis) {
  // Connect intercepting routes with their targets
  analysis.interceptingRoutes.forEach((intercepting) => {
    const targetRoute = analysis.routes.find((route) =>
      route.path.endsWith(intercepting.targetSegment)
    );

    if (targetRoute) {
      intercepting.targetRoute = targetRoute;
      if (!targetRoute.interceptedBy) {
        targetRoute.interceptedBy = [];
      }
      targetRoute.interceptedBy.push(intercepting);
    }
  });
}

function groupApiRoutes(analysis) {
  // Group API routes by common prefixes
  const apiGroups = {};

  analysis.apiRoutes.forEach((api) => {
    const segments = api.path.split("/").filter(Boolean);
    const groupKey = segments.length > 0 ? segments[0] : "root";

    if (!apiGroups[groupKey]) {
      apiGroups[groupKey] = [];
    }

    apiGroups[groupKey].push(api);
  });

  analysis.apiGroups = apiGroups;
}

function generateSummary(analysis) {
  analysis.summary = {
    totalRoutes: analysis.routes.filter((r) => r.isPage).length,
    totalLayouts: analysis.layouts.length,
    totalApiRoutes: analysis.apiRoutes.length,
    totalSpecialFiles: analysis.specialFiles.length,
    totalMetadataFiles: analysis.metadataFiles.length,
    totalConfigFiles: analysis.configFiles.length,
    totalColocatedFiles: analysis.colocatedFiles.length,
    totalPrivateFolders: analysis.privatefolders.length,

    // Route type counts
    routeGroups: analysis.routeGroups.length,
    parallelRoutes: analysis.parallelRoutes.length,
    interceptingRoutes: analysis.interceptingRoutes.length,

    // Dynamic route analysis
    dynamicRoutes: analysis.routes.filter(
      (r) =>
        r.routeType === "dynamic" ||
        r.routeType === "catch-all" ||
        r.routeType === "optional-catch-all"
    ).length,

    // API route analysis
    apiGroups: Object.keys(analysis.apiGroups || {}).length,
    serverActionsCount: analysis.apiRoutes.reduce(
      (count, route) => count + (route.serverActions?.length || 0),
      0
    ),

    // Layout inheritance depth
    maxLayoutDepth: Math.max(
      ...analysis.routes.map((r) => (r.layoutChain ? r.layoutChain.length : 0)),
      0
    ),

    // Feature flags
    hasRouteGroups: analysis.routeGroups.length > 0,
    hasParallelRoutes: analysis.parallelRoutes.length > 0,
    hasInterceptingRoutes: analysis.interceptingRoutes.length > 0,
    hasDynamicRoutes: analysis.routes.some((r) =>
      ["dynamic", "catch-all", "optional-catch-all"].includes(r.routeType)
    ),
    hasNestedLayouts: analysis.routes.some(
      (r) => r.layoutChain && r.layoutChain.length > 1
    ),
    hasMetadataFiles: analysis.metadataFiles.length > 0,
    hasServerActions: analysis.apiRoutes.some(
      (r) => r.serverActions?.length > 0
    ),
    hasPrivateFolders: analysis.privatefolders.length > 0,
    hasColocatedFiles: analysis.colocatedFiles.length > 0,
    hasMiddleware: analysis.configFiles.some((f) => f.type === "middleware"),
  };
}
