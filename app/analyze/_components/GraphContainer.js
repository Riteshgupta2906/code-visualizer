"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
} from "@xyflow/react";
import { useDependencyView } from "../hooks/useDependencyView";
import { useSchemaView } from "../hooks/useSchemaView";
import FloatingTopBar from "./ProjectSideBar/sideBar";
import ProjectInfoPanel from "./ProjectSideBar/projectInfoPanel";
import FileCodeViewer from "./ProjectSideBar/FileCodePreview";
import { LoadingOverlay } from "./LoadingOverlay";
import "@xyflow/react/dist/style.css";

export default function GraphContainer({
  analysisData,
  projectStats,
  projectPath,
}) {
  const [currentView, setCurrentView] = useState("dependency");
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const reactFlowInstance = useRef(null);
  const hasInitialFitView = useRef(false);

  // Filter analysis data to show only root folder with app folder as child
  const filteredData = useMemo(() => {
    if (!analysisData?.data?.structure) return null;

    const appFolder = analysisData.data.structure.children?.find(
      (child) => child.type === "folder" && child.name === "app"
    );

    if (!appFolder) return analysisData;

    return {
      ...analysisData,
      data: {
        ...analysisData.data,
        structure: {
          ...analysisData.data.structure,
          children: [appFolder],
        },
      },
    };
  }, [analysisData]);

  // Get prisma info
  const prismaInfo = analysisData?.data?.prismaInfo;

  // Custom hooks for each view
  const dependencyView = useDependencyView(filteredData?.data?.structure);
  const schemaView = useSchemaView(selectedSchema, prismaInfo);
  console.log("Schema View Data:", schemaView);

  // Get active view data
  const activeView = useMemo(() => {
    return currentView === "schema" ? schemaView : dependencyView;
  }, [currentView, schemaView, dependencyView]);

  // Fetch file content when a file node is selected
  useEffect(() => {
    const fetchFileContent = async () => {
      if (
        !selectedNode ||
        selectedNode.type !== "file" ||
        !selectedNode.data.filePath
      ) {
        setFileContent(null);
        return;
      }

      setLoadingFile(true);
      try {
        const response = await fetch("/api/read-file", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filePath: selectedNode.data.filePath,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setFileContent(data.content);
        } else {
          console.error("Failed to fetch file content");
          setFileContent(null);
        }
      } catch (error) {
        console.error("Error fetching file content:", error);
        setFileContent(null);
      } finally {
        setLoadingFile(false);
      }
    };

    fetchFileContent();
  }, [selectedNode]);

  // Handle view change
  const handleViewChange = useCallback(
    (newView) => {
      setCurrentView(newView);
      // Clear selected node when changing views
      setSelectedNode(null);
      setFileContent(null);

      // Auto-load first schema when switching to schema view
      if (
        newView === "schema" &&
        !selectedSchema &&
        prismaInfo?.detected &&
        prismaInfo.schemas.length > 0
      ) {
        setSelectedSchema(prismaInfo.schemas[0].filePath);
      }

      // Fit view after switching
      if (reactFlowInstance.current) {
        setTimeout(() => {
          reactFlowInstance.current.fitView({
            padding: 0.3,
            duration: 300,
            minZoom: 0.2,
            maxZoom: 1.0,
          });
        }, 100);
      }
    },
    [selectedSchema, prismaInfo]
  );

  // Handle schema selection
  const handleSchemaSelect = useCallback((schemaPath) => {
    setSelectedSchema(schemaPath);
  }, []);

  // ReactFlow state
  const [flowNodes, setNodes, onNodesChange] = useNodesState(activeView.nodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(activeView.edges);

  // Update nodes and edges when active view changes
  useEffect(() => {
    setNodes(activeView.nodes);
    setEdges(activeView.edges);
  }, [activeView.nodes, activeView.edges, setNodes, setEdges]);

  // Handle ReactFlow initialization
  const onInit = useCallback((instance) => {
    reactFlowInstance.current = instance;

    if (!hasInitialFitView.current) {
      setTimeout(() => {
        instance.fitView({
          padding: 0.3,
          duration: 0,
          minZoom: 0.2,
          maxZoom: 1.0,
        });
        hasInitialFitView.current = true;
      }, 50);
    }
  }, []);

  // Default edge options - different for each view
  const defaultEdgeOptions = useMemo(() => {
    if (currentView === "schema") {
      return {
        type: "smoothstep",
        animated: false,
        style: {
          strokeWidth: 2,
        },
      };
    }

    return {
      type: "smoothstep",
      animated: false,
      style: {
        strokeWidth: 2,
        stroke: "#4B5563",
      },
    };
  }, [currentView]);

  // Fit view options based on current view
  const fitViewOptions = useMemo(() => {
    if (currentView === "schema") {
      return {
        padding: 0.3,
        minZoom: 0.2,
        maxZoom: 1.0,
      };
    }

    return {
      padding: 0.2,
      minZoom: 0.1,
      maxZoom: 1.5,
    };
  }, [currentView]);

  // Custom node click handler to show file content
  const handleNodeClick = useCallback((event, node) => {
    event.stopPropagation();
    console.log("Node clicked:", node);

    // Only set selected node if it's a file type
    if (node.type === "file") {
      setSelectedNode(node);
    }
  }, []);

  // Handle closing the file viewer
  const handleCloseFileViewer = useCallback(() => {
    setSelectedNode(null);
    setFileContent(null);
  }, []);

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
        onNodeClick={handleNodeClick}
        onInit={onInit}
        nodeTypes={activeView.nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={fitViewOptions}
        attributionPosition="top-right"
        className="bg-gray-900"
        minZoom={0}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        {/* FloatingTopBar with view and schema controls */}
        <FloatingTopBar
          structure={analysisData?.data?.structure}
          currentView={currentView}
          onViewChange={handleViewChange}
          selectedSchema={selectedSchema}
          onSchemaSelect={handleSchemaSelect}
          prismaInfo={prismaInfo}
          allExpanded={dependencyView.allExpanded}
          onExpandAll={dependencyView.expandAll}
          onCollapseAll={dependencyView.collapseAll}
        />

        {/* Project Info Panel - Pass schema stats when in schema view */}
        <ProjectInfoPanel
          projectStats={projectStats}
          projectPath={projectPath}
          currentView={currentView}
          schemaStats={
            currentView === "schema" ? schemaView.schemaData?.stats : null
          }
          schemaFileName={
            currentView === "schema" ? schemaView.schemaData?.fileName : null
          }
        />

        {/* MiniMap */}
        <MiniMap
          className="shadow-2xl border border-gray-700 rounded bg-gray-800"
          nodeStrokeWidth={2}
          maskColor="rgba(0, 0, 0, 0.3)"
          nodeColor={activeView.getNodeColor}
          style={{
            backgroundColor: "#1f2937",
          }}
        />

        {/* Background */}
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

      {/* File Code Viewer */}
      <FileCodeViewer
        selectedNode={selectedNode}
        fileContent={fileContent}
        loading={loadingFile}
        onClose={handleCloseFileViewer}
      />

      {/* Loading Overlay */}
      {activeView.loading && (
        <LoadingOverlay message={activeView.loadingMessage} />
      )}
    </div>
  );
}
