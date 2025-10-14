"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  useReactFlow,
} from "@xyflow/react";

// Import components
import DependencyNode from "./flow/DependencyNode";
import FolderNode from "./flow/FolderNode";
import FileNode from "./flow/fileNode";
import { ZoomSlider } from "@/components/zoom-slider";

// Import utilities
import {
  buildTreeLayout,
  mergeDependencyNodes,
  createNodeId,
} from "./flow/utills";
import "@xyflow/react/dist/style.css";

export default function EnhancedTreeFlowComponent({ analysisData }) {
  // Core state
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [dependencyAnalysisResults, setDependencyAnalysisResults] = useState(
    new Map()
  );
  const [currentZoom, setCurrentZoom] = useState(1);
  const [allExpanded, setAllExpanded] = useState(false);
  const reactFlowInstance = useRef(null);
  const hasInitialFitView = useRef(false);

  // Filter analysis data to show only root folder with app folder as child
  const filteredData = useMemo(() => {
    if (!analysisData?.data?.structure) return null;

    const appFolder = analysisData.data.structure.children?.find(
      (child) => child.type === "folder" && child.name === "app"
    );

    if (!appFolder) return analysisData;

    // Create a new structure with root containing only app folder
    return {
      ...analysisData,
      data: {
        ...analysisData.data,
        structure: {
          ...analysisData.data.structure,
          children: [appFolder], // Only include app folder
        },
      },
    };
  }, [analysisData]);

  // Helper function to recursively collect all folder node IDs
  const getAllFolderIds = useCallback(
    (node, parentPath = "", isRoot = false) => {
      const folderIds = new Set();

      // Build the current path using the same logic as buildTreeLayout
      let currentPath;
      if (isRoot) {
        currentPath = "root";
      } else {
        currentPath = `${parentPath}-${node.name}`;
      }

      // Use the same createNodeId function from utills to ensure consistency
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

  // Initialize with root and app expanded only (first two layers)
  useEffect(() => {
    if (filteredData?.data?.structure) {
      const firstLayerNodes = new Set();

      // Expand root
      firstLayerNodes.add("root");

      // Expand app folder
      firstLayerNodes.add("root-app");

      setExpandedNodes(firstLayerNodes);
      setAllExpanded(false);
    }
  }, [filteredData]);

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

  // Expand all folders
  const expandAll = useCallback(() => {
    if (filteredData?.data?.structure) {
      const allFolderIds = new Set();

      // Add root
      allFolderIds.add("root");

      // Recursively collect all folder IDs from the structure (treating root as special)
      if (filteredData.data.structure.children) {
        filteredData.data.structure.children.forEach((child) => {
          const childIds = getAllFolderIds(child, "root", false);
          childIds.forEach((id) => allFolderIds.add(id));
        });
      }

      setExpandedNodes(allFolderIds);
      setAllExpanded(true);

      // Call fitView after expanding all nodes
      if (reactFlowInstance.current) {
        setTimeout(() => {
          reactFlowInstance.current.fitView({
            padding: 0.2,
            duration: 300,
            minZoom: 0.1,
            maxZoom: 1.5,
          });
        }, 100);
      }
    }
  }, [filteredData, getAllFolderIds]);

  // Collapse all to initial state (first two layers)
  const collapseAll = useCallback(() => {
    const firstLayerNodes = new Set();
    firstLayerNodes.add("root");
    firstLayerNodes.add("root-app");
    setExpandedNodes(firstLayerNodes);
    setAllExpanded(false);

    // Call fitView after collapsing
    if (reactFlowInstance.current) {
      setTimeout(() => {
        reactFlowInstance.current.fitView({
          padding: 0.2,
          duration: 300,
          minZoom: 0.1,
          maxZoom: 1.5,
        });
      }, 100);
    }
  }, []);

  // Track zoom changes
  const onViewportChange = useCallback((viewport) => {
    setCurrentZoom(viewport.zoom);
  }, []);

  // Handle dependency analysis
  const handleDependencyAnalysis = useCallback((fileNodeId, dependencyData) => {
    setDependencyAnalysisResults((prev) => {
      const newMap = new Map(prev);

      // If dependencyData is null, remove the entry (hide dependencies)
      if (dependencyData === null) {
        newMap.delete(fileNodeId);
      } else {
        // Otherwise, add/update the dependency data
        newMap.set(fileNodeId, dependencyData.data);
      }

      return newMap;
    });
  }, []);

  // Calculate nodes and edges
  const { allNodes, allEdges } = useMemo(() => {
    if (!filteredData?.data?.structure) {
      return { allNodes: [], allEdges: [] };
    }

    const { nodes: baseNodes, edges: baseEdges } = buildTreeLayout(
      filteredData.data.structure,
      expandedNodes,
      toggleNode,
      handleDependencyAnalysis
    );

    const { dependencyNodes, dependencyEdges } = mergeDependencyNodes(
      baseNodes,
      dependencyAnalysisResults
    );

    return {
      allNodes: [...baseNodes, ...dependencyNodes],
      allEdges: [...baseEdges, ...dependencyEdges],
    };
  }, [
    filteredData,
    expandedNodes,
    dependencyAnalysisResults,
    toggleNode,
    handleDependencyAnalysis,
  ]);

  // ReactFlow state
  const [flowNodes, setNodes, onNodesChange] = useNodesState(allNodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(allEdges);

  // Update nodes and edges when they change
  useEffect(() => {
    setNodes(allNodes);
    setEdges(allEdges);
  }, [allNodes, allEdges, setNodes, setEdges]);

  // Handle ReactFlow initialization and call fitView only once
  const onInit = useCallback((instance) => {
    reactFlowInstance.current = instance;

    // Call fitView only on initial render
    if (!hasInitialFitView.current) {
      setTimeout(() => {
        instance.fitView({
          padding: 0.2, // 20% padding
          duration: 0, // No animation on initial render
          minZoom: 0.1,
          maxZoom: 1.5,
        });
        hasInitialFitView.current = true;
      }, 50);
    }
  }, []);

  const nodeTypes = useMemo(
    () => ({
      folder: FolderNode,
      file: FileNode,
      dependency: DependencyNode,
    }),
    []
  );

  const onNodeClick = useCallback(
    (event, node) => {
      event.stopPropagation();
      if (node.type === "folder") {
        toggleNode(node.data.nodeId);
      }
    },
    [toggleNode]
  );

  // Default edge options for consistent styling
  const defaultEdgeOptions = useMemo(
    () => ({
      type: "smoothstep",
      animated: false,
      style: {
        strokeWidth: 2,
        stroke: "#4B5563",
      },
    }),
    []
  );

  if (!analysisData?.data?.structure) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-gray-400">No project data available</p>
          <p className="text-sm text-gray-600">
            Upload a Next.js project to see the App Router structure
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onViewportChange={onViewportChange}
        onInit={onInit}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 1.5,
        }}
        attributionPosition="top-right"
        className="bg-gray-900"
        minZoom={0}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <ZoomSlider
          position="top-right"
          allExpanded={allExpanded}
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
        />
        <MiniMap
          className="shadow-2xl border border-gray-700 rounded bg-gray-800"
          nodeStrokeWidth={2}
          maskColor="rgba(0, 0, 0, 0.3)"
          nodeColor={(node) => {
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
          }}
          style={{
            backgroundColor: "#1f2937",
          }}
        />
        <Background
          variant="dots"
          gap={24}
          size={2}
          color="#434a54ff"
          style={{
            backgroundColor: "#000000ff",
          }}
        />
      </ReactFlow>
    </div>
  );
}
