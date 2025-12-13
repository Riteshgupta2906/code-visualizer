import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import fastGlob from "fast-glob";

// ==========================================
// CONFIG & HELPERS
// ==========================================

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
              // Convert "@/*" to "@" for webpack alias format matching
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
          return aliases;
        }
      } catch (error) {
        // console.warn(`⚠️ Could not parse ${configFile}:`, error.message);
      }
    }
  }

  // Default Next.js alias fallback
  const srcPath = path.join(projectPath, "src");
  if (fs.existsSync(srcPath)) {
    return {
      "@": srcPath,
      "~": path.join(projectPath, "public"),
    };
  }

  return {
    "@": projectPath,
    "~": path.join(projectPath, "public"),
  };
}

/**
 * Custom Resolver Logic
 */
function resolveImport(importPath, sourceFilePath, projectRoot, aliases) {
  // 1. Handle Path Aliases (e.g., @/components/...)
  for (const [alias, aliasRoot] of Object.entries(aliases)) {
    if (importPath.startsWith(alias)) {
      // e.g. importPath = "@/components/Button", alias = "@"
      // rest = "/components/Button"
      // OR importPath = "lib/utils", alias = "lib" (if baseUrl is set)
      
      let relativePart = importPath.substring(alias.length);
      if (relativePart.startsWith("/")) relativePart = relativePart.substring(1);
      
      const potentialPath = path.join(aliasRoot, relativePart);
      return resolveExtension(potentialPath, projectRoot);
    }
  }

  // 2. Handle Relative Imports (e.g., ./Button, ../utils)
  if (importPath.startsWith(".")) {
    const absolutePath = path.resolve(path.dirname(sourceFilePath), importPath);
    return resolveExtension(absolutePath, projectRoot);
  }

  // 3. External Package or Unresolved
  // We return the raw string to indicate it's an external dependency
  return {
    resolved: false,
    path: importPath
  };
}

/**
 * Checks for file existence with various extensions
 */
function resolveExtension(absolutePathWithoutExt, projectRoot) {
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"];
  
  // Check exact file match first if extension provided
  if (fs.existsSync(absolutePathWithoutExt) && fs.statSync(absolutePathWithoutExt).isFile()) {
     return { resolved: true, path: path.relative(projectRoot, absolutePathWithoutExt) };
  }

  // Check extensions
  for (const ext of extensions) {
    const p = absolutePathWithoutExt + ext;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return { resolved: true, path: path.relative(projectRoot, p) };
    }
  }

  // Check Directory Index
  if (fs.existsSync(absolutePathWithoutExt) && fs.statSync(absolutePathWithoutExt).isDirectory()) {
     for (const ext of extensions) {
        if (ext === "") continue;
        const indexP = path.join(absolutePathWithoutExt, "index" + ext);
        if (fs.existsSync(indexP)) {
           return { resolved: true, path: path.relative(projectRoot, indexP) };
        }
     }
  }

  // If we couldn't find the file on disk, but it looks like a project path (not node_modules),
  // we treat it as unresolved local (maybe generated?).
  // But usually, if it's not found, it's either an error or a fancy webpack loader.
  // For safety, if we couldn't resolve it to a file, we return it as unresolved.
  
  return { resolved: false, path: absolutePathWithoutExt }; // Or null?
}


// ==========================================
// MAIN ANALYZER
// ==========================================

export async function analyzeProjectDependencies(projectRoot) {
  const graph = {}; // { "path/to/file.ts": ["dep1", "dep2"] }
  const aliases = extractPathAliases(projectRoot);

  // 1. Glob all source files
  const files = await fastGlob(["**/*.{js,jsx,ts,tsx,mjs,cjs}"], {
    cwd: projectRoot,
    ignore: ["node_modules/**", ".next/**", "dist/**", "build/**", "**/*.d.ts"],
    absolute: true,
  });

  for (const filePath of files) {
    const relativeFilePath = path.relative(projectRoot, filePath);
    const imports = new Set();
    
    try {
      const code = fs.readFileSync(filePath, "utf8");
      
      // 2. Parse AST
      const ast = parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx", "decorators-legacy", "classProperties"],
        errorRecovery: true // Continue even if syntax errors
      });

      // 3. Traverse AST for Import Declarations
      const traverseFn = traverse.default || traverse;
      traverseFn(ast, {
        ImportDeclaration({ node }) {
          imports.add(node.source.value);
        },
        ExportNamedDeclaration({ node }) {
            if (node.source) imports.add(node.source.value);
        },
        ExportAllDeclaration({ node }) {
            if (node.source) imports.add(node.source.value);
        },
        CallExpression({ node }) {
           // Handle dynamic imports: import('./foo') or require('./foo')
           if (node.callee.type === 'Import' && node.arguments[0]?.type === 'StringLiteral') {
               imports.add(node.arguments[0].value);
           }
           if (node.callee.name === 'require' && node.arguments[0]?.type === 'StringLiteral') {
               imports.add(node.arguments[0].value);
           }
        }
      });

      // 4. Resolve Imports
      const resolvedImports = [];
      imports.forEach(importString => {
         const result = resolveImport(importString, filePath, projectRoot, aliases);
         
         // If resolved to a local file, use the relative path
         // If external/unresolved, keep the import string
         resolvedImports.push(result.resolved ? result.path : importString);
      });

      graph[relativeFilePath] = resolvedImports;

    } catch (e) {
      console.warn(`Failed to parse ${relativeFilePath}: ${e.message}`);
      graph[relativeFilePath] = [];
    }
  }

  return graph;
}

export async function analyzeDependencies(filePath, projectRoot) {
    // Just reuse the full project analysis logic for now, or optimize to parse single file
    // But since we need resolution context (aliases), full analysis is safer or we extract the resolution logic.
    // For performance, let's extract the single file logic.
    
    // NOTE: This function is called by the API for "onclick" detailed analysis.
    // Ideally we shouldn't re-scan the whole project.
    
    const aliases = extractPathAliases(projectRoot);
    const imports = new Set();
    
    try {
      const code = fs.readFileSync(filePath, "utf8");
      const ast = parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx", "decorators-legacy", "classProperties"],
        errorRecovery: true
      });

      const traverseFn = traverse.default || traverse;
      traverseFn(ast, {
        ImportDeclaration({ node }) {
          imports.add(node.source.value);
        },
        ExportNamedDeclaration({ node }) {
            if (node.source) imports.add(node.source.value);
        },
        ExportAllDeclaration({ node }) {
            if (node.source) imports.add(node.source.value);
        },
        // Simply ignore dynamic imports for the quick view if it complicates things, or keep them.
        CallExpression({ node }) {
           if (node.callee.type === 'Import' && node.arguments[0]?.type === 'StringLiteral') {
               imports.add(node.arguments[0].value);
           }
           if (node.callee.name === 'require' && node.arguments[0]?.type === 'StringLiteral') {
               imports.add(node.arguments[0].value);
           }
        }
      });

      const localDependencies = [];
      const externalDependencies = [];

      imports.forEach(importString => {
         const result = resolveImport(importString, filePath, projectRoot, aliases);
         
         if (result.resolved) {
             localDependencies.push({
                 name: path.basename(result.path),
                 resolvedPath: path.resolve(projectRoot, result.path),
                 relativePath: result.path,
                 specifiers: [], // We didn't capture specifiers in this simple pass, can enhance later
                 isLocal: true,
                 exists: true
             });
         } else {
             externalDependencies.push({
                 name: importString,
                 resolvedPath: importString,
                 specifiers: [],
                 isLocal: false,
                 exists: true // Assumed
             });
         }
      });

      return { localDependencies, externalDependencies };

    } catch (e) {
        console.error("Single file analysis error", e);
        return { localDependencies: [], externalDependencies: [] };
    }
}

export async function findReverseDependencies(targetFilePath, projectRoot) {
  // Can't avoid full scan for reverse deps
  const graph = await analyzeProjectDependencies(projectRoot);
  
  // Normalize target
  const normalizedTarget = targetFilePath.startsWith("/") 
     ? path.relative(projectRoot, targetFilePath) 
     : targetFilePath;

  const importers = [];
  
  for (const [file, deps] of Object.entries(graph)) {
      if (deps.includes(normalizedTarget)) {
          importers.push({
              filePath: file,
              relativePath: file,
              name: path.basename(file)
          });
      }
  }
  return importers;
}
