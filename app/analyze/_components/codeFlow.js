// "use client";

// import { useCallback, useMemo, useState, useEffect, useRef } from "react";
// import {
//   ReactFlow,
//   Controls,
//   Background,
//   useNodesState,
//   useEdgesState,
//   MiniMap,
// } from "@xyflow/react";
// import { Badge } from "@/components/ui/badge";
// import { Globe, Code, Route, Layers } from "lucide-react";

// // Import our components
// import DependencyNode from "./flow/DependencyNode";
// import FolderNode from "./flow/FolderNode";
// import FileNode from "./flow/fileNode";
// import { ZoomSlider } from "@/components/zoom-slider"; // Import the new zoom slider

// // Import utilities
// import { buildTreeLayout, mergeDependencyNodes } from "./flow/utills";
// import "@xyflow/react/dist/style.css";

// export default function EnhancedTreeFlowComponent({ analysisData }) {
//   // Core state
//   const [expandedNodes, setExpandedNodes] = useState(new Set());
//   const [dependencyAnalysisResults, setDependencyAnalysisResults] = useState(
//     new Map()
//   );
//   const [currentZoom, setCurrentZoom] = useState(1);
//   const reactFlowRef = useRef(null);
//   console.log(analysisData);

//   // Initialize with first layer expanded
//   useEffect(() => {
//     if (analysisData?.data?.structure?.children) {
//       const firstLayerNodes = new Set();
//       firstLayerNodes.add("root");

//       analysisData.data.structure.children.forEach((child) => {
//         if (child.type === "folder") {
//           firstLayerNodes.add(`root-${child.name}`);
//         }
//       });

//       setExpandedNodes(firstLayerNodes);
//     }
//   }, [analysisData]);

//   // Toggle node expansion
//   const toggleNode = useCallback((nodeId) => {
//     setExpandedNodes((prev) => {
//       const newSet = new Set(prev);
//       if (newSet.has(nodeId)) {
//         newSet.delete(nodeId);
//       } else {
//         newSet.add(nodeId);
//       }
//       return newSet;
//     });
//   }, []);

//   // Handle zoom changes from the slider
//   const handleZoomChange = useCallback((newZoom) => {
//     if (reactFlowRef.current) {
//       const reactFlowInstance = reactFlowRef.current;
//       const currentViewport = reactFlowInstance.getViewport();
//       reactFlowInstance.setViewport({
//         ...currentViewport,
//         zoom: newZoom,
//       });
//       setCurrentZoom(newZoom);
//     }
//   }, []);

//   // Track zoom changes from other interactions (mouse wheel, etc.)
//   const onViewportChange = useCallback((viewport) => {
//     setCurrentZoom(viewport.zoom);
//   }, []);
//   // Handle dependency analysis results
//   const handleDependencyAnalysis = useCallback((fileNodeId, dependencyData) => {
//     console.log("Adding dependency analysis for:", fileNodeId);
//     setDependencyAnalysisResults((prev) =>
//       new Map(prev).set(fileNodeId, dependencyData.data)
//     );
//   }, []);

//   // Calculate all nodes and edges
//   const { allNodes, allEdges } = useMemo(() => {
//     if (!analysisData?.data?.structure) {
//       return { allNodes: [], allEdges: [] };
//     }

//     // Build base tree layout
//     const { nodes: baseNodes, edges: baseEdges } = buildTreeLayout(
//       analysisData.data.structure,
//       expandedNodes,
//       toggleNode,
//       handleDependencyAnalysis
//     );

//     // Add dependency nodes if any exist
//     const { dependencyNodes, dependencyEdges } = mergeDependencyNodes(
//       baseNodes,
//       dependencyAnalysisResults
//     );

//     return {
//       allNodes: [...baseNodes, ...dependencyNodes],
//       allEdges: [...baseEdges, ...dependencyEdges],
//     };
//   }, [
//     analysisData,
//     expandedNodes,
//     dependencyAnalysisResults,
//     toggleNode,
//     handleDependencyAnalysis,
//   ]);

//   // ReactFlow state
//   const [flowNodes, setNodes, onNodesChange] = useNodesState(allNodes);
//   const [flowEdges, setEdges, onEdgesChange] = useEdgesState(allEdges);

//   // Update ReactFlow when our calculated nodes change
//   useEffect(() => {
//     setNodes(allNodes);
//     setEdges(allEdges);
//   }, [allNodes, allEdges, setNodes, setEdges]);

//   // Node types
//   const nodeTypes = useMemo(
//     () => ({
//       folder: FolderNode,
//       file: FileNode,
//       dependency: DependencyNode,
//     }),
//     []
//   );

//   // Handle node clicks
//   const onNodeClick = useCallback(
//     (event, node) => {
//       event.stopPropagation();
//       if (node.type === "folder") {
//         toggleNode(node.data.nodeId);
//       }
//     },
//     [toggleNode]
//   );

//   // Early return for no data
//   if (!analysisData?.data?.structure) {
//     return (
//       <div className="w-full h-full flex items-center justify-center bg-gray-900">
//         <div className="text-center">
//           <p className="text-gray-400">No project data available</p>
//           <p className="text-sm text-gray-600">
//             Upload a Next.js project to see the App Router structure
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const insights = analysisData.data.insights;

//   return (
//     <div className="w-full h-full flex flex-col bg-gray-900">
//       {/* Header */}
//       <div className="bg-gray-900/95 backdrop-blur-sm shadow-2xl border-b border-gray-800">
//         <div className="px-6 py-4">
//           {/* Insights */}
//           {insights && (
//             <div className="flex flex-wrap gap-2">
//               {insights.routeCount > 0 && (
//                 <Badge className="bg-green-900/50 text-green-400 border-green-800 hover:bg-green-900/70">
//                   <Globe className="w-3 h-3 mr-1" />
//                   {insights.routeCount} Routes
//                 </Badge>
//               )}
//               {insights.apiEndpointCount > 0 && (
//                 <Badge className="bg-purple-900/50 text-purple-400 border-purple-800 hover:bg-purple-900/70">
//                   <Code className="w-3 h-3 mr-1" />
//                   {insights.apiEndpointCount} API Endpoints
//                 </Badge>
//               )}
//               {insights.routePatterns.dynamic > 0 && (
//                 <Badge className="bg-blue-900/50 text-blue-400 border-blue-800 hover:bg-blue-900/70">
//                   <Route className="w-3 h-3 mr-1" />
//                   {insights.routePatterns.dynamic} Dynamic Routes
//                 </Badge>
//               )}
//               {insights.routePatterns.routeGroups > 0 && (
//                 <Badge className="bg-indigo-900/50 text-indigo-400 border-indigo-800 hover:bg-indigo-900/70">
//                   <Layers className="w-3 h-3 mr-1" />
//                   {insights.routePatterns.routeGroups} Route Groups
//                 </Badge>
//               )}

//               {/* Dependency analysis stats */}
//               {dependencyAnalysisResults.size > 0 && (
//                 <Badge className="bg-orange-900/50 text-orange-400 border-orange-800 hover:bg-orange-900/70">
//                   <Code className="w-3 h-3 mr-1" />
//                   {dependencyAnalysisResults.size} Files Analyzed
//                 </Badge>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ReactFlow */}
//       <div className="flex-1 relative">
//         <ReactFlow
//           ref={reactFlowRef}
//           nodes={flowNodes}
//           edges={flowEdges}
//           onNodesChange={onNodesChange}
//           onEdgesChange={onEdgesChange}
//           onNodeClick={onNodeClick}
//           onViewportChange={onViewportChange}
//           nodeTypes={nodeTypes}
//           fitView
//           fitViewOptions={{ padding: 100 }}
//           attributionPosition="top-right"
//           className="bg-gray-900"
//           minZoom={0.2}
//           maxZoom={2}
//         >
//           {/* Zoom Slider */}
//           <ZoomSlider
//             position="top-left"
//             // onZoomChange={handleZoomChange}
//             // currentZoom={currentZoom}
//             // minZoom={0.3}
//             // maxZoom={2}
//           />

//           {/* MiniMap */}
//           <MiniMap
//             className="shadow-2xl border border-gray-700 rounded bg-gray-800"
//             nodeStrokeWidth={2}
//             maskColor="rgba(0, 0, 0, 0.3)"
//             nodeColor={(node) => {
//               switch (node.type) {
//                 case "folder":
//                   return "#3b82f6";
//                 case "file":
//                   return "#10b981";
//                 case "dependency":
//                   return "#8b5cf6";
//                 default:
//                   return "#6b7280";
//               }
//             }}
//             style={{
//               backgroundColor: "#1f2937",
//             }}
//           />
//           <Background
//             variant="dots"
//             gap={20}
//             size={1}
//             color="#374151"
//             style={{
//               backgroundColor: "#111827",
//             }}
//           />
//         </ReactFlow>
//       </div>
//     </div>
//   );
// }

"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
} from "@xyflow/react";

// Import components
import DependencyNode from "./flow/DependencyNode";
import FolderNode from "./flow/FolderNode";
import FileNode from "./flow/fileNode";
import { ZoomSlider } from "@/components/zoom-slider";

// Import utilities
import { buildTreeLayout, mergeDependencyNodes } from "./flow/utills";
import "@xyflow/react/dist/style.css";

export default function EnhancedTreeFlowComponent({ analysisData }) {
  // Core state
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [dependencyAnalysisResults, setDependencyAnalysisResults] = useState(
    new Map()
  );
  const [currentZoom, setCurrentZoom] = useState(1);
  const reactFlowRef = useRef(null);

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

  // Initialize with root and app expanded only
  useEffect(() => {
    if (filteredData?.data?.structure) {
      const firstLayerNodes = new Set();

      // Expand root
      firstLayerNodes.add("root");

      // Expand app folder
      firstLayerNodes.add("root-app");

      setExpandedNodes(firstLayerNodes);
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

  // Track zoom changes
  const onViewportChange = useCallback((viewport) => {
    setCurrentZoom(viewport.zoom);
  }, []);

  // Handle dependency analysis
  const handleDependencyAnalysis = useCallback((fileNodeId, dependencyData) => {
    console.log("Adding dependency analysis for:", fileNodeId);
    setDependencyAnalysisResults((prev) =>
      new Map(prev).set(fileNodeId, dependencyData.data)
    );
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

  useEffect(() => {
    setNodes(allNodes);
    setEdges(allEdges);
  }, [allNodes, allEdges, setNodes, setEdges]);

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
    <div className="w-full h-full bg-gray-900">
      <ReactFlow
        ref={reactFlowRef}
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onViewportChange={onViewportChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 100 }}
        attributionPosition="top-right"
        className="bg-gray-900"
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <ZoomSlider position="top-right" />
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
