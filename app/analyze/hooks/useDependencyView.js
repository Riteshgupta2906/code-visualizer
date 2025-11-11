import { useState, useCallback, useMemo } from "react";
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
export function useDependencyView(structure) {
  const [expandedNodes, setExpandedNodes] = useState(
    new Set(["root", "root-app"])
  );
  const [dependencyAnalysisResults, setDependencyAnalysisResults] = useState(
    new Map()
  );
  const [allExpanded, setAllExpanded] = useState(false);

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
  const handleDependencyAnalysis = useCallback((fileNodeId, dependencyData) => {
    setDependencyAnalysisResults((prev) => {
      const newMap = new Map(prev);

      if (dependencyData === null) {
        newMap.delete(fileNodeId);
      } else {
        newMap.set(fileNodeId, dependencyData.data);
      }

      return newMap;
    });
  }, []);

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
      handleDependencyAnalysis
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
