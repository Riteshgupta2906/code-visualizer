import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";

export async function parseFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const fileInfo = {
      path: filePath,
      name: path.basename(filePath),
      extension: path.extname(filePath),
      imports: [],
      exports: [],
      functions: [],
      components: [],
    };

    // Only parse JavaScript/TypeScript files
    if (![".js", ".jsx", ".ts", ".tsx"].includes(fileInfo.extension)) {
      return fileInfo;
    }

    // Parse the file into AST
    const ast = parse(content, {
      sourceType: "module",
      plugins: [
        "jsx",
        "typescript",
        "decorators-legacy",
        "classProperties",
        "dynamicImport",
        "exportDefaultFrom",
        "exportNamespaceFrom",
        "objectRestSpread",
        "functionBind",
        "nullishCoalescingOperator",
        "optionalChaining",
      ],
    });

    // Traverse the AST to extract information
    traverse.default(ast, {
      ImportDeclaration(nodePath) {
        const node = nodePath.node;
        const importInfo = {
          source: node.source.value,
          specifiers: node.specifiers.map((spec) => {
            if (spec.type === "ImportDefaultSpecifier") {
              return { type: "default", local: spec.local.name };
            } else if (spec.type === "ImportNamespaceSpecifier") {
              return { type: "namespace", local: spec.local.name };
            } else {
              return {
                type: "named",
                imported: spec.imported.name,
                local: spec.local.name,
              };
            }
          }),
        };
        fileInfo.imports.push(importInfo);
      },

      ExportDeclaration(nodePath) {
        const node = nodePath.node;
        if (node.type === "ExportNamedDeclaration") {
          if (node.declaration) {
            if (node.declaration.type === "FunctionDeclaration") {
              fileInfo.exports.push({
                type: "function",
                name: node.declaration.id?.name,
              });
            } else if (node.declaration.type === "VariableDeclaration") {
              node.declaration.declarations.forEach((decl) => {
                fileInfo.exports.push({
                  type: "variable",
                  name: decl.id.name,
                });
              });
            }
          }

          if (node.specifiers) {
            node.specifiers.forEach((spec) => {
              fileInfo.exports.push({
                type: "named",
                name: spec.exported.name,
                local: spec.local.name,
              });
            });
          }
        } else if (node.type === "ExportDefaultDeclaration") {
          let name = "default";
          if (
            node.declaration.type === "FunctionDeclaration" ||
            node.declaration.type === "ClassDeclaration"
          ) {
            name = node.declaration.id?.name || "default";
          }
          fileInfo.exports.push({
            type: "default",
            name,
          });
        }
      },

      FunctionDeclaration(nodePath) {
        const node = nodePath.node;
        if (node.id) {
          fileInfo.functions.push({
            name: node.id.name,
            params: node.params.length,
            async: node.async,
          });
        }
      },

      // Detect React components (function components)
      VariableDeclarator(nodePath) {
        const node = nodePath.node;
        if (
          node.init &&
          (node.init.type === "ArrowFunctionExpression" ||
            node.init.type === "FunctionExpression")
        ) {
          // Check if it returns JSX (simple heuristic)
          if (hasJSXReturn(node.init)) {
            fileInfo.components.push({
              name: node.id.name,
              type: "functional",
            });
          }
        }
      },

      // Detect class components
      ClassDeclaration(nodePath) {
        const node = nodePath.node;
        const hasReactComponent =
          node.superClass &&
          (node.superClass.name === "Component" ||
            (node.superClass.type === "MemberExpression" &&
              node.superClass.property.name === "Component"));

        if (hasReactComponent) {
          fileInfo.components.push({
            name: node.id.name,
            type: "class",
          });
        }
      },
    });

    return fileInfo;
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error.message);
    return {
      path: filePath,
      name: path.basename(filePath),
      extension: path.extname(filePath),
      imports: [],
      exports: [],
      functions: [],
      components: [],
      parseError: error.message,
    };
  }
}

function hasJSXReturn(functionNode) {
  // Simple heuristic to detect JSX return
  // This is a basic check and might not catch all cases
  let hasJSX = false;

  traverse.default(
    {
      type: "Program",
      body: [functionNode],
    },
    {
      ReturnStatement(path) {
        if (
          path.node.argument &&
          (path.node.argument.type === "JSXElement" ||
            path.node.argument.type === "JSXFragment")
        ) {
          hasJSX = true;
        }
      },
      JSXElement() {
        hasJSX = true;
      },
      JSXFragment() {
        hasJSX = true;
      },
    }
  );

  return hasJSX;
}
