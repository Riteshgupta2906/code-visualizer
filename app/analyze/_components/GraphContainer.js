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
import SchemaLegend from "./SchemaLegend";
import { LoadingOverlay } from "./LoadingOverlay";
import "@xyflow/react/dist/style.css";

export default function GraphContainer({
  analysisData,
  projectStats,
  projectPath,
}) {
  const [currentView, setCurrentView] = useState("dependency");
  const [selectedSchema, setSelectedSchema] = useState(null); // This is the folder path if schema folder
  const [selectedSchemaFile, setSelectedSchemaFile] = useState(null); // specific file inside folder
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const reactFlowInstance = useRef(null);
  const hasInitialFitView = useRef(false);

  // No filtering needed - structure is already the app folder from server
  const structure = analysisData?.data?.structure;

  // Get prisma info
  const prismaInfo = analysisData?.data?.prismaInfo;
  
  // Determine effective paths for hook
  const effectiveSchemaPath = selectedSchemaFile || selectedSchema;
  const effectiveFolderPath = selectedSchemaFile ? selectedSchema : null;

  // Custom hooks for each view
  const dependencyView = useDependencyView(
    structure,
    analysisData?.data?.dependencyMap
  );
  const schemaView = useSchemaView(
      effectiveSchemaPath, 
      prismaInfo, 
      undefined, 
      undefined, 
      selectedModel,
      effectiveFolderPath
  );

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
        // Just select the first one (file or folder)
        const firstSchema = prismaInfo.schemas[0];
        setSelectedSchema(firstSchema.filePath);

        // If it is a schema folder, select the first file by default
        if (firstSchema.isSchemaFolder && firstSchema.files?.length > 0) {
            setSelectedSchemaFile(firstSchema.files[0].filePath);
        } else {
            setSelectedSchemaFile(null);
        }
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
    
    // Find the schema object to check if it's a folder
    const schema = prismaInfo?.schemas?.find(s => s.filePath === schemaPath);
    
    if (schema?.isSchemaFolder && schema.files?.length > 0) {
        // Default to the first file
        setSelectedSchemaFile(schema.files[0].filePath);
    } else {
        setSelectedSchemaFile(null); 
    }
    
    setSelectedModel(null); // Reset model selection when schema changes
  }, [prismaInfo]);
  
  const handleSchemaFileSelect = useCallback((filePath) => {
      setSelectedSchemaFile(filePath);
      setSelectedModel(null);
  }, []);

  const handleModelSelect = useCallback((modelName) => {
    setSelectedModel(modelName);
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

  if (!structure) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-gray-400">No App Router structure available</p>
          <p className="text-sm text-gray-600">
            Upload a Next.js project with an App Router to see the structure
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
          projectPath={projectPath}
          allExpanded={dependencyView.allExpanded}
          onExpandAll={dependencyView.expandAll}
          onCollapseAll={dependencyView.collapseAll}
          currentView={currentView}
          onViewChange={handleViewChange}
          selectedSchema={selectedSchema}
          onSchemaSelect={handleSchemaSelect}
          selectedSchemaFile={selectedSchemaFile}
          onSchemaFileSelect={handleSchemaFileSelect}
          prismaInfo={prismaInfo}
          gitInfo={analysisData?.data?.gitInfo}
          allModels={schemaView.allModels}
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
        />

        {/* Project Info Panel - Pass schema stats when in schema view */}
        <ProjectInfoPanel
          projectStats={projectStats}
          schemaStats={activeView?.schemaData?.stats}
          currentView={currentView}
          gitInfo={analysisData?.data?.gitInfo}
          schemaFileName={
            currentView === "schema" ? activeView?.schemaData?.fileName : null
          }
        />

       

        {/* Schema Legend */}
        {currentView === "schema" && <SchemaLegend />}

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

      {/* Error Overlay */}
      {activeView.error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-8">
          <div className="bg-red-950/90 border border-red-500/50 rounded-xl shadow-2xl max-w-2xl w-full p-6 text-red-200 overflow-hidden">
            <h3 className="text-xl font-bold text-red-100 mb-4 flex items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Schema Validation Error
            </h3>
            <div className="bg-black/50 rounded-lg p-4 font-mono text-sm overflow-auto max-h-[60vh] whitespace-pre-wrap">
              {activeView.error}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  // Optional: Add a way to dismiss or retry, currently just stays until schema changes
                  // For now, maybe just let them know they need to fix the file
                }}
                className="px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-100 rounded-lg transition-colors border border-red-700/50"
              >
                Please fix errors in your schema file
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}