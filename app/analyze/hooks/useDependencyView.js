import { useState, useCallback, useMemo, useEffect } from "react";
import {
  buildTreeLayout,
  mergeDependencyNodes,
  createNodeId,
} from "../_components/flow/utills";
import FolderNode from "../_components/flow/FolderNode";
import FileNode from "../_components/flow/fileNode";
import DependencyNode from "../_components/flow/DependencyNode";

/**
 * Custom hook for managing dependency view (folder structure)
 */
export function useDependencyView(structure, dependencyMap) {
  const [expandedNodes, setExpandedNodes] = useState(
    new Set(["root", "root-app"])
  );
  const [dependencyAnalysisResults, setDependencyAnalysisResults] = useState(
    new Map()
  );
  const [allExpanded, setAllExpanded] = useState(false);

  // Helper to traverse structure and map file paths to node IDs
  const mapPathsToNodeIds = useCallback((node, path = "", map = new Map()) => {
    const nodeId = createNodeId(path);
    if (node.type === "file") {
      map.set(node.fullPath, nodeId);
    }

    if (node.children) {
      node.children.forEach((child) => {
        const childPath = path ? `${path}-${child.name}` : child.name;
        mapPathsToNodeIds(child, childPath, map);
      });
    }
    return map;
  }, []);

  // Initialize dependency results from global map
  useEffect(() => {
    if (!structure || !dependencyMap) return;

    const pathToNodeId = mapPathsToNodeIds(structure, "root");
    const newResults = new Map();

    Object.values(dependencyMap).forEach((fileData) => {
      const nodeId = pathToNodeId.get(fileData.fullPath);
      if (nodeId) {
        const result = {};

        if (
          (fileData.imports && fileData.imports.length > 0) ||
          (fileData.externalImports && fileData.externalImports.length > 0)
        ) {
          result.outgoing = {
            localDependencies: fileData.imports || [],
            externalDependencies: fileData.externalImports || [],
          };
        }

        if (fileData.importedBy && fileData.importedBy.length > 0) {
          result.incoming = {
            importedBy: fileData.importedBy.map((imp) => ({
              filePath: imp.source, // Map source to filePath for consistency
              relativePath: imp.relativePath,
              name: imp.name,
            })),
          };
        }

        if (Object.keys(result).length > 0) {
          newResults.set(nodeId, result);
        }
      }
    });

    setDependencyAnalysisResults(newResults);
  }, [structure, dependencyMap, mapPathsToNodeIds]);

  // Toggle node expansion
  const toggleNode = useCallback((nodeId) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Helper function to recursively collect all folder node IDs
  const getAllFolderIds = useCallback(
    (node, parentPath = "", isRoot = false) => {
      const folderIds = new Set();

      let currentPath;
      if (isRoot) {
        currentPath = "root";
      } else {
        currentPath = `${parentPath}-${node.name}`;
      }

      const nodeId = createNodeId(currentPath);

      if (node.type === "folder" || isRoot) {
        folderIds.add(nodeId);

        if (node.children && node.children.length > 0) {
          node.children.forEach((child) => {
            if (child.type === "folder") {
              const childIds = getAllFolderIds(child, currentPath, false);
              childIds.forEach((id) => folderIds.add(id));
            }
          });
        }
      }

      return folderIds;
    },
    []
  );

  // Expand all folders
  const expandAll = useCallback(() => {
    if (structure) {
      const allFolderIds = new Set();
      allFolderIds.add("root");

      if (structure.children) {
        structure.children.forEach((child) => {
          const childIds = getAllFolderIds(child, "root", false);
          childIds.forEach((id) => allFolderIds.add(id));
        });
      }

      setExpandedNodes(allFolderIds);
      setAllExpanded(true);
    }
  }, [structure, getAllFolderIds]);

  // Collapse all to initial state (first two layers)
  const collapseAll = useCallback(() => {
    const firstLayerNodes = new Set();
    firstLayerNodes.add("root");
    firstLayerNodes.add("root-app");
    setExpandedNodes(firstLayerNodes);
    setAllExpanded(false);
  }, []);

  // Handle dependency analysis
  const handleDependencyAnalysis = useCallback(
    (fileNodeId, filePath, mode = "outgoing") => {
      setDependencyAnalysisResults((prev) => {
        const newMap = new Map(prev);
        const currentData = newMap.get(fileNodeId) || {};

        // If explicitly null (clearing), remove the mode
        if (filePath === null) {
          const newData = { ...currentData };
          delete newData[mode];

          if (Object.keys(newData).length === 0) {
            newMap.delete(fileNodeId);
          } else {
            newMap.set(fileNodeId, newData);
          }
          return newMap;
        }

        // Look up data in dependency map
        const fileData = dependencyMap[filePath];
        console.log("fileData", fileData,mode);      
        if (!fileData) {
          console.warn(`No dependency data found for ${filePath}`);
          return newMap;
        }

        let modeData = null;

        if (mode === "outgoing") {
          if (
            (fileData.imports && fileData.imports.length > 0) ||
            (fileData.externalImports && fileData.externalImports.length > 0)
          ) {
            modeData = {
              localDependencies: fileData.imports || [],
              externalDependencies: fileData.externalImports || [],
            };
          }
        } else if (mode === "incoming") {
          if (fileData.importedBy && fileData.importedBy.length > 0) {
            modeData = {
              importedBy: fileData.importedBy.map((imp) => ({
                filePath: imp.source,
                relativePath: imp.relativePath,
                name: imp.name,
              })),
            };
          }
        }
        console.log("modeData", modeData, mode);  

        if (modeData) {
          newMap.set(fileNodeId, {
            ...currentData,
            [mode]: modeData,
          });
        }

        return newMap;
      });
    },
    [dependencyMap]
  );

  // Calculate nodes and edges
  const graphData = useMemo(() => {
    if (!structure) {
      return {
        nodes: [],
        edges: [],
        nodeTypes: {},
      };
    }

    const { nodes: baseNodes, edges: baseEdges } = buildTreeLayout(
      structure,
      expandedNodes,
      toggleNode,
      handleDependencyAnalysis,
      dependencyAnalysisResults
    );

    const { dependencyNodes, dependencyEdges } = mergeDependencyNodes(
      baseNodes,
      dependencyAnalysisResults
    );

    return {
      nodes: [...baseNodes, ...dependencyNodes],
      edges: [...baseEdges, ...dependencyEdges],
      nodeTypes: {
        folder: FolderNode,
        file: FileNode,
        dependency: DependencyNode,
      },
    };
  }, [
    structure,
    expandedNodes,
    dependencyAnalysisResults,
    toggleNode,
    handleDependencyAnalysis,
  ]);

  // Node click handler
  const onNodeClick = useCallback(
    (event, node) => {
      event.stopPropagation();
      if (node.type === "folder") {
        toggleNode(node.data.nodeId);
      }
    },
    [toggleNode]
  );

  // Get node color for minimap
  const getNodeColor = useCallback((node) => {
    switch (node.type) {
      case "folder":
        return "#3b82f6";
      case "file":
        return "#10b981";
      case "dependency":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  }, []);

  return {
    nodes: graphData.nodes,
    edges: graphData.edges,
    nodeTypes: graphData.nodeTypes,
    expandedNodes,
    allExpanded,
    toggleNode,
    expandAll,
    collapseAll,
    onNodeClick,
    getNodeColor,
    loading: false,
    loadingMessage: "",
  };
}
