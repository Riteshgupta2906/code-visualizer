import fs from "fs";
import path from "path";
import ignore from "ignore";

/**
 * Extracts HTTP methods from API route file
 */
function extractAPIMethodsFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const methods = [];

    // Look for exported HTTP method functions
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

    methodPatterns.forEach((pattern, index) => {
      if (pattern.test(fileContent)) {
        methods.push(methodNames[index]);
      }
    });

    return methods.sort();
  } catch (error) {
    console.error("Error reading API file:", error);
    return [];
  }
}

/**
 * Analyzes a Prisma schema file and extracts comprehensive statistics
 */
function analyzePrismaSchema(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const lines = fileContent.split("\n");
    const stats = fs.statSync(filePath);

    const analysis = {
      fileName: path.basename(filePath),
      filePath: filePath,
      fileSize: `${(stats.size / 1024).toFixed(2)} KB`,
      lastModified: stats.mtime.toISOString(),
      lineCount: lines.length,

      stats: {
        models: 0,
        enums: 0,
        views: 0,
        types: 0,

        relationships: {
          total: 0,
          oneToOne: 0,
          oneToMany: 0,
          manyToMany: 0,
          selfRelations: 0,
        },

        fields: {
          total: 0,
          required: 0,
          optional: 0,
          unique: 0,
          indexed: 0,
        },

        fieldTypes: {},

        datasource: {
          provider: null,
        },

        generators: [],

        constraints: {
          primaryKeys: 0,
          uniqueConstraints: 0,
          indexes: 0,
        },
      },

      modelNames: [],
      enumNames: [],
    };

    let currentContext = "top_level"; // Can be: top_level, in_model, in_enum, in_datasource, in_generator
    let currentModelName = null;
    let currentModelFields = [];
    let braceDepth = 0;

    // Track relations for relationship type detection
    const relationFields = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and comments
      if (
        !line ||
        line.startsWith("//") ||
        line.startsWith("/*") ||
        line.startsWith("*")
      ) {
        continue;
      }

      // Track brace depth for context management
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceDepth += openBraces - closeBraces;

      // Detect model blocks
      if (line.match(/^model\s+(\w+)\s*{/)) {
        const match = line.match(/^model\s+(\w+)\s*{/);
        currentModelName = match[1];
        analysis.stats.models++;
        analysis.modelNames.push(currentModelName);
        currentContext = "in_model";
        currentModelFields = [];
        continue;
      }

      // Detect enum blocks
      if (line.match(/^enum\s+(\w+)\s*{/)) {
        const match = line.match(/^enum\s+(\w+)\s*{/);
        analysis.stats.enums++;
        analysis.enumNames.push(match[1]);
        currentContext = "in_enum";
        continue;
      }

      // Detect view blocks (Prisma 5.0+)
      if (line.match(/^view\s+(\w+)\s*{/)) {
        analysis.stats.views++;
        currentContext = "in_model"; // Treat views similar to models
        continue;
      }

      // Detect type blocks (composite types)
      if (line.match(/^type\s+(\w+)\s*{/)) {
        analysis.stats.types++;
        currentContext = "in_model"; // Treat types similar to models
        continue;
      }

      // Detect datasource blocks
      if (line.match(/^datasource\s+\w+\s*{/)) {
        currentContext = "in_datasource";
        continue;
      }

      // Detect generator blocks
      if (line.match(/^generator\s+\w+\s*{/)) {
        currentContext = "in_generator";
        continue;
      }

      // Extract datasource provider
      if (currentContext === "in_datasource" && line.includes("provider")) {
        const match = line.match(/provider\s*=\s*["'](\w+)["']/);
        if (match) {
          analysis.stats.datasource.provider = match[1];
        }
      }

      // Extract generator
      if (currentContext === "in_generator" && line.includes("provider")) {
        const match = line.match(/provider\s*=\s*["']([^"']+)["']/);
        if (match) {
          analysis.stats.generators.push(match[1]);
        }
      }

      // Parse fields inside models
      if (currentContext === "in_model" && currentModelName) {
        // Check for closing brace (end of model)
        if (line === "}" && braceDepth === 0) {
          currentContext = "top_level";
          currentModelName = null;
          currentModelFields = [];
          continue;
        }

        // Skip model-level attributes
        if (line.startsWith("@@")) {
          // Count unique constraints
          if (line.includes("@@unique")) {
            analysis.stats.constraints.uniqueConstraints++;
          }
          // Count indexes
          if (line.includes("@@index")) {
            analysis.stats.constraints.indexes++;
          }
          // Count composite primary keys
          if (line.includes("@@id")) {
            analysis.stats.constraints.primaryKeys++;
          }
          continue;
        }

        // Parse field definitions
        const fieldMatch = line.match(/^(\w+)\s+(\w+)(\[\])?(\?)?/);
        if (fieldMatch) {
          const [, fieldName, fieldType, isArray, isOptional] = fieldMatch;

          analysis.stats.fields.total++;
          currentModelFields.push({
            name: fieldName,
            type: fieldType,
            isArray: !!isArray,
            isOptional: !!isOptional,
            modelName: currentModelName,
          });

          // Count optional vs required
          if (isOptional) {
            analysis.stats.fields.optional++;
          } else {
            analysis.stats.fields.required++;
          }

          // Track field types
          if (!analysis.stats.fieldTypes[fieldType]) {
            analysis.stats.fieldTypes[fieldType] = 0;
          }
          analysis.stats.fieldTypes[fieldType]++;

          // Check for @id (primary key)
          if (line.includes("@id")) {
            analysis.stats.constraints.primaryKeys++;
          }

          // Check for @unique
          if (line.includes("@unique")) {
            analysis.stats.fields.unique++;
          }

          // Check for @relation (indicates relationship)
          if (line.includes("@relation")) {
            analysis.stats.relationships.total++;

            // Store relation info for later analysis
            relationFields.push({
              modelName: currentModelName,
              fieldName: fieldName,
              fieldType: fieldType,
              isArray: !!isArray,
              line: line,
            });

            // Detect self-relations
            if (fieldType === currentModelName) {
              analysis.stats.relationships.selfRelations++;
            }
          }
        }
      }

      // Reset context when closing braces at top level
      if (braceDepth === 0 && line === "}") {
        currentContext = "top_level";
      }
    }

    // Analyze relationship types based on collected relation fields
    analyzeRelationshipTypes(relationFields, analysis);

    // Count indexed fields (approximate - counts fields mentioned in @@index)
    const indexMatches = fileContent.match(/@@index\(\[([^\]]+)\]/g);
    if (indexMatches) {
      indexMatches.forEach((match) => {
        const fieldsInIndex = match.match(/\w+/g);
        if (fieldsInIndex) {
          analysis.stats.fields.indexed += fieldsInIndex.length - 1; // -1 to exclude "index" keyword
        }
      });
    }

    return analysis;
  } catch (error) {
    console.error(`Error analyzing Prisma schema ${filePath}:`, error);
    return {
      fileName: path.basename(filePath),
      filePath: filePath,
      error: error.message,
      stats: null,
    };
  }
}

/**
 * Analyzes relationship types based on relation fields
 */
function analyzeRelationshipTypes(relationFields, analysis) {
  // Group relations by model pairs
  const relationPairs = {};

  relationFields.forEach((rel) => {
    const key = [rel.modelName, rel.fieldType].sort().join("-");
    if (!relationPairs[key]) {
      relationPairs[key] = [];
    }
    relationPairs[key].push(rel);
  });

  // Analyze each relation pair
  Object.values(relationPairs).forEach((pair) => {
    if (pair.length === 1) {
      // Only one side defined - likely one-to-many or one-to-one
      const rel = pair[0];
      if (rel.isArray) {
        analysis.stats.relationships.oneToMany++;
      } else {
        analysis.stats.relationships.oneToOne++;
      }
    } else if (pair.length === 2) {
      // Both sides defined
      const hasArrayOnBothSides = pair.every((r) => r.isArray);
      const hasArrayOnOneSide =
        pair.some((r) => r.isArray) && !hasArrayOnBothSides;

      if (hasArrayOnBothSides) {
        // Many-to-many (implicit or explicit)
        analysis.stats.relationships.manyToMany++;
      } else if (hasArrayOnOneSide) {
        // One-to-many
        analysis.stats.relationships.oneToMany++;
      } else {
        // One-to-one
        analysis.stats.relationships.oneToOne++;
      }
    }
  });
}

/**
 * Detects Prisma schema files in the project
 */
function detectPrismaSchemas(projectPath) {
  const prismaInfo = {
    detected: false,
    schemaFolder: null,
    schemas: [],
  };

  // Check if prisma folder exists
  const prismaFolderPath = path.join(projectPath, "prisma");

  if (
    !fs.existsSync(prismaFolderPath) ||
    !fs.statSync(prismaFolderPath).isDirectory()
  ) {
    return prismaInfo;
  }

  prismaInfo.detected = true;
  prismaInfo.schemaFolder = "prisma/";

  // Function to recursively find .prisma files
  function findPrismaFiles(dirPath, relativePath = "") {
    const items = fs.readdirSync(dirPath);

    items.forEach((item) => {
      const fullPath = path.join(dirPath, item);
      const relPath = path.join(relativePath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursively search subdirectories
        findPrismaFiles(fullPath, relPath);
      } else if (item.endsWith(".prisma")) {
        // Analyze the schema file
        const schemaAnalysis = analyzePrismaSchema(fullPath);

        if (schemaAnalysis) {
          prismaInfo.schemas.push({
            ...schemaAnalysis,
            relativePath: relPath,
          });
        }
      }
    });
  }

  // Start searching from prisma folder
  findPrismaFiles(prismaFolderPath, "prisma/");

  return prismaInfo;
}

/**
 * Analyzes a folder name to determine its Next.js routing type
 */
function analyzeRoutingPattern(folderName) {
  // Route Groups: (folderName)
  if (folderName.startsWith("(") && folderName.endsWith(")")) {
    return {
      type: "route-group",
      displayName: folderName.slice(1, -1), // Remove parentheses
      routingType: "Route Group",
      urlEffect: "No URL impact",
      description:
        "Groups routes for organization without affecting URL structure",
    };
  }

  // Private Folders: _folderName
  if (folderName.startsWith("_")) {
    return {
      type: "private-folder",
      displayName: folderName,
      routingType: "Private Folder",
      urlEffect: "Not routable",
      description: "Private implementation detail, excluded from routing",
    };
  }

  // Dynamic Routes: [param] or [id]
  if (folderName.startsWith("[") && folderName.endsWith("]")) {
    const paramName = folderName.slice(1, -1);

    // Optional catch-all: [[...slug]]
    if (paramName.startsWith("[...") && paramName.endsWith("]")) {
      return {
        type: "optional-catch-all-route",
        displayName: folderName,
        paramName: paramName.slice(4, -1), // Remove [... and ]
        routingType: "Optional Catch-all Route",
        urlEffect: `Matches /route and /route/a/b/c`,
        description: "Matches zero or more path segments",
      };
    }

    // Catch-all: [...slug]
    if (paramName.startsWith("...")) {
      return {
        type: "catch-all-route",
        displayName: folderName,
        paramName: paramName.slice(3), // Remove ...
        routingType: "Catch-all Route",
        urlEffect: `Matches /route/a/b/c`,
        description: "Matches one or more path segments",
      };
    }

    // Regular dynamic route: [id]
    return {
      type: "dynamic-route",
      displayName: folderName,
      paramName,
      routingType: "Dynamic Route",
      urlEffect: `Matches /route/123, /route/abc`,
      description: "Matches a single dynamic path segment",
    };
  }

  // Parallel Routes: @folder
  if (folderName.startsWith("@")) {
    return {
      type: "parallel-route",
      displayName: folderName,
      slotName: folderName.slice(1), // Remove @
      routingType: "Parallel Route",
      urlEffect: "Named slot",
      description: "Renders content in parallel with the main page",
    };
  }

  // Intercepting Routes: (.)folder, (..)folder, (..)(..)folder, (...)folder
  if (folderName.match(/^\(\.+\)/)) {
    const interceptLevel = folderName.match(/^\((\.*)\)/)[1];
    let interceptType = "same-level";
    let description = "Intercepts routes at the same level";

    if (interceptLevel === "..") {
      interceptType = "one-level-up";
      description = "Intercepts routes one level above";
    } else if (interceptLevel === "../..") {
      interceptType = "two-levels-up";
      description = "Intercepts routes two levels above";
    } else if (interceptLevel === "...") {
      interceptType = "from-root";
      description = "Intercepts routes from the root";
    }

    return {
      type: "intercepting-route",
      displayName: folderName,
      interceptLevel: interceptType,
      routingType: "Intercepting Route",
      urlEffect: "Modal/overlay behavior",
      description,
    };
  }

  // Regular folder - static route segment
  return {
    type: "static-route",
    displayName: folderName,
    routingType: "Static Route",
    urlEffect: `Matches /route/${folderName}`,
    description: "Static path segment",
  };
}

/**
 * Analyzes a file to determine its Next.js App Router purpose
 */
function analyzeAppRouterFile(fileName, filePath, parentPath) {
  const fileBase = fileName.split(".")[0];
  const fileExt = path.extname(fileName);
  const validExtensions = [".js", ".jsx", ".ts", ".tsx"];

  if (!validExtensions.includes(fileExt)) {
    return {
      type: "regular-file",
      purpose: "Asset/Config",
      description: "Non-route file",
    };
  }

  // Special App Router files
  const specialFiles = {
    layout: {
      type: "layout-file",
      purpose: "Layout Component",
      description: "Shared UI that wraps child pages and layouts",
    },
    page: {
      type: "page-file",
      purpose: "Page Component",
      description: "Unique UI for a route and makes routes publicly accessible",
    },
    loading: {
      type: "loading-file",
      purpose: "Loading UI",
      description: "Loading UI for page or layout (React Suspense boundary)",
    },
    "not-found": {
      type: "not-found-file",
      purpose: "Not Found UI",
      description: "Not found UI for a route segment",
    },
    error: {
      type: "error-file",
      purpose: "Error UI",
      description: "Error UI for a route segment (React Error Boundary)",
    },
    "global-error": {
      type: "global-error-file",
      purpose: "Global Error UI",
      description: "Global error UI for the entire application",
    },
    route: {
      type: "api-route-file",
      purpose: "API Route",
      description: "Server-side API endpoint",
    },
    template: {
      type: "template-file",
      purpose: "Template Component",
      description: "Re-rendered layout that creates new state on navigation",
    },
    default: {
      type: "default-file",
      purpose: "Default Component",
      description: "Fallback UI for parallel routes",
    },
  };

  if (specialFiles[fileBase]) {
    const fileAnalysis = {
      ...specialFiles[fileBase],
      isAppRouterSpecial: true,
    };

    // If it's a route.js file anywhere in the app router, extract HTTP methods
    if (fileBase === "route") {
      const methods = extractAPIMethodsFromFile(filePath);
      fileAnalysis.apiMethods = methods;
      if (methods.length > 0) {
        fileAnalysis.description = `API endpoint: ${methods.join(", ")}`;
      }
    }

    return fileAnalysis;
  }

  return {
    type: "component-file",
    purpose: "Component/Utility",
    description: "React component or utility file",
  };
}

/**
 * Determines if a folder is part of the App Router structure
 */
function isAppRouterFolder(folderPath, rootPath) {
  const relativePath = path.relative(rootPath, folderPath);
  return relativePath.startsWith("app/") || relativePath === "app";
}

/**
 * Creates an ignore instance from the project's .gitignore file.
 */
function getIgnorer(projectPath) {
  const ig = ignore();
  const gitignorePath = path.join(projectPath, ".gitignore");

  ig.add(["node_modules", ".next", ".git", "dist", "build"]);

  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
    ig.add(gitignoreContent);
  }

  return ig;
}

/**
 * Recursively builds directory tree with Next.js App Router analysis
 */
function buildDirectoryTree(dirPath, ignorer, rootPath, parentRoutePath = "") {
  const relativePath = path.relative(rootPath, dirPath);

  if (relativePath && ignorer.ignores(relativePath)) {
    return null;
  }

  const name = path.basename(dirPath);
  const stats = fs.statSync(dirPath);
  const isAppRouter = isAppRouterFolder(dirPath, rootPath);

  if (stats.isDirectory()) {
    const children = fs
      .readdirSync(dirPath)
      .map((child) => {
        const childPath = path.join(dirPath, child);
        const currentRoutePath = isAppRouter
          ? buildRoutePath(parentRoutePath, name, analyzeRoutingPattern(name))
          : "";

        return buildDirectoryTree(
          childPath,
          ignorer,
          rootPath,
          currentRoutePath
        );
      })
      .filter((child) => child !== null);

    const folderAnalysis = isAppRouter ? analyzeRoutingPattern(name) : null;

    return {
      type: "folder",
      name,
      children,
      isAppRouter,
      routingAnalysis: folderAnalysis,
      routePath: isAppRouter
        ? buildRoutePath(parentRoutePath, name, folderAnalysis)
        : null,
      specialFiles: isAppRouter ? detectSpecialFiles(children) : null,
      // Add full path information for folders
      fullPath: dirPath,
      relativePath: relativePath || name,
    };
  } else {
    const fileAnalysis = isAppRouter
      ? analyzeAppRouterFile(name, dirPath, path.dirname(dirPath))
      : null;

    return {
      type: "file",
      name,
      isAppRouter,
      fileAnalysis,
      // Add full path information for files
      fullPath: dirPath,
      relativePath: relativePath || name,
    };
  }
}

/**
 * Builds the URL path for a route based on its routing pattern
 */
function buildRoutePath(parentPath, folderName, routingAnalysis) {
  if (!routingAnalysis) return parentPath;

  const basePath = parentPath || "";

  switch (routingAnalysis.type) {
    case "route-group":
    case "private-folder":
    case "parallel-route":
    case "intercepting-route":
      return basePath; // These don't affect the URL path

    case "dynamic-route":
      return `${basePath}/[${routingAnalysis.paramName}]`;

    case "catch-all-route":
      return `${basePath}/[...${routingAnalysis.paramName}]`;

    case "optional-catch-all-route":
      return `${basePath}/[[...${routingAnalysis.paramName}]]`;

    case "static-route":
    default:
      // For app router, skip the /app prefix in the URL path
      if (folderName === "app" && basePath === "") {
        return "";
      }
      return `${basePath}/${folderName}`;
  }
}

/**
 * Detects special Next.js files in a folder's children
 */
function detectSpecialFiles(children) {
  const specialFiles = {
    hasPage: false,
    hasLayout: false,
    hasLoading: false,
    hasError: false,
    hasNotFound: false,
    hasApiRoute: false,
    hasTemplate: false,
    hasDefault: false,
  };

  children.forEach((child) => {
    if (child.type === "file" && child.fileAnalysis?.isAppRouterSpecial) {
      const fileType = child.fileAnalysis.type;

      switch (fileType) {
        case "page-file":
          specialFiles.hasPage = true;
          break;
        case "layout-file":
          specialFiles.hasLayout = true;
          break;
        case "loading-file":
          specialFiles.hasLoading = true;
          break;
        case "error-file":
          specialFiles.hasError = true;
          break;
        case "not-found-file":
          specialFiles.hasNotFound = true;
          break;
        case "api-route-file":
          specialFiles.hasApiRoute = true;
          break;
        case "template-file":
          specialFiles.hasTemplate = true;
          break;
        case "default-file":
          specialFiles.hasDefault = true;
          break;
      }
    }
  });

  return specialFiles;
}

/**
 * Analyzes the folder structure with Next.js App Router intelligence
 */
export async function analyzeProject(projectPath) {
  if (!fs.existsSync(projectPath) || !fs.statSync(projectPath).isDirectory()) {
    throw new Error(`Project path is not a valid directory: ${projectPath}`);
  }

  const ignorer = getIgnorer(projectPath);
  const projectStructure = buildDirectoryTree(
    projectPath,
    ignorer,
    projectPath
  );

  // Add project root to the structure
  if (projectStructure) {
    projectStructure.projectRoot = projectPath;
  }

  // Extract additional insights
  const insights = analyzeProjectInsights(projectStructure);

  // Detect and analyze Prisma schemas
  const prismaInfo = detectPrismaSchemas(projectPath);

  return {
    structure: projectStructure,
    insights,
    prismaInfo,
    metadata: {
      analyzedAt: new Date().toISOString(),
      hasAppRouter: insights.appRouterDetected,
      totalRoutes: insights.routeCount,
      totalApiEndpoints: insights.apiEndpointCount,
      hasPrisma: prismaInfo.detected,
      totalPrismaSchemas: prismaInfo.schemas.length,
      projectRoot: projectPath,
    },
  };
}

/**
 * Analyzes project for high-level insights
 */
function analyzeProjectInsights(structure) {
  const insights = {
    appRouterDetected: false,
    routeCount: 0,
    apiEndpointCount: 0,
    routePatterns: {
      static: 0,
      dynamic: 0,
      catchAll: 0,
      optionalCatchAll: 0,
      routeGroups: 0,
      privateFolders: 0,
      parallelRoutes: 0,
      interceptingRoutes: 0,
    },
    specialFiles: {
      layouts: 0,
      pages: 0,
      loading: 0,
      errors: 0,
      notFound: 0,
      templates: 0,
      defaults: 0,
    },
  };

  function traverseStructure(node) {
    if (node.isAppRouter) {
      insights.appRouterDetected = true;

      if (node.type === "folder" && node.routingAnalysis) {
        const routeType = node.routingAnalysis.type;

        // Map the route types correctly
        switch (routeType) {
          case "static-route":
            insights.routePatterns.static++;
            break;
          case "dynamic-route":
            insights.routePatterns.dynamic++;
            break;
          case "catch-all-route":
            insights.routePatterns.catchAll++;
            break;
          case "optional-catch-all-route":
            insights.routePatterns.optionalCatchAll++;
            break;
          case "route-group":
            insights.routePatterns.routeGroups++;
            break;
          case "private-folder":
            insights.routePatterns.privateFolders++;
            break;
          case "parallel-route":
            insights.routePatterns.parallelRoutes++;
            break;
          case "intercepting-route":
            insights.routePatterns.interceptingRoutes++;
            break;
        }

        if (node.specialFiles?.hasPage) {
          insights.routeCount++;
        }

        if (node.specialFiles?.hasApiRoute) {
          insights.apiEndpointCount++;
        }
      }

      if (node.type === "file" && node.fileAnalysis?.isAppRouterSpecial) {
        const fileType = node.fileAnalysis.type;

        switch (fileType) {
          case "layout-file":
            insights.specialFiles.layouts++;
            break;
          case "page-file":
            insights.specialFiles.pages++;
            break;
          case "loading-file":
            insights.specialFiles.loading++;
            break;
          case "error-file":
            insights.specialFiles.errors++;
            break;
          case "not-found-file":
            insights.specialFiles.notFound++;
            break;
          case "template-file":
            insights.specialFiles.templates++;
            break;
          case "default-file":
            insights.specialFiles.defaults++;
            break;
        }
      }
    }

    if (node.children) {
      node.children.forEach(traverseStructure);
    }
  }

  traverseStructure(structure);
  return insights;
}
