"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  Handle,
  Position,
} from "reactflow";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  File,
  Globe,
  Code,
  Route,
  Lock,
  Eye,
  Zap,
  Layers,
  GitBranch,
  Share2,
  Package,
  ExternalLink,
  CheckCircle,
  XCircle,
  Import,
  ArrowRight,
  Loader2,
} from "lucide-react";

import "reactflow/dist/style.css";

// Dependency Node Component
const DependencyNode = ({ data }) => {
  const { dependencyInfo, isLocal, exists, name } = data;

  const getNodeColor = () => {
    if (isLocal) {
      return exists
        ? "from-green-50 to-green-100 border-green-300"
        : "from-red-50 to-red-100 border-red-300";
    }
    return "from-blue-50 to-blue-100 border-blue-300";
  };

  const getNodeIcon = () => {
    if (isLocal) {
      return exists ? (
        <File className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      );
    }
    return <Package className="h-4 w-4 text-blue-600" />;
  };

  const getImportTypeBadge = () => {
    const importType = dependencyInfo.type;
    const badgeProps = {
      import: { color: "bg-green-100 text-green-800", icon: Import },
      "dynamic-import": { color: "bg-purple-100 text-purple-800", icon: Zap },
      require: { color: "bg-yellow-100 text-yellow-800", icon: Code },
      "export-from": { color: "bg-blue-100 text-blue-800", icon: ArrowRight },
      "export-all-from": {
        color: "bg-indigo-100 text-indigo-800",
        icon: ArrowRight,
      },
    };

    const config = badgeProps[importType] || badgeProps.import;
    const IconComponent = config.icon;

    return (
      <Badge className={`text-xs ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {importType}
      </Badge>
    );
  };

  const getSpecifiersBadges = () => {
    if (!dependencyInfo.specifiers || dependencyInfo.specifiers.length === 0) {
      return null;
    }

    const visibleSpecifiers = dependencyInfo.specifiers.slice(0, 3);
    const hasMore = dependencyInfo.specifiers.length > 3;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {visibleSpecifiers.map((spec, index) => {
          let displayName = spec.local || spec.imported || spec.exported;
          if (spec.type === "ImportDefaultSpecifier") {
            displayName = `default as ${spec.local}`;
          } else if (spec.type === "ImportNamespaceSpecifier") {
            displayName = `* as ${spec.local}`;
          }

          return (
            <span
              key={spec.id || index}
              className="inline-block text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono"
            >
              {displayName}
            </span>
          );
        })}
        {hasMore && (
          <span className="inline-block text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
            +{dependencyInfo.specifiers.length - 3} more
          </span>
        )}
      </div>
    );
  };

  const getStatusIcon = () => {
    if (isLocal) {
      return exists ? (
        <CheckCircle className="w-3 h-3 text-green-600" />
      ) : (
        <XCircle className="w-3 h-3 text-red-600" />
      );
    }
    return <ExternalLink className="w-3 h-3 text-blue-600" />;
  };

  const truncateName = (name, maxLength = 25) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  return (
    <Card
      className={`dependency-node min-w-[200px] max-w-[280px] shadow-md bg-gradient-to-br ${getNodeColor()} border-2`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {getNodeIcon()}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate" title={name}>
                {truncateName(name)}
              </div>
              <div className="flex items-center space-x-1 mt-1">
                {getStatusIcon()}
                <span className="text-xs text-gray-600">
                  {isLocal
                    ? exists
                      ? "Local file"
                      : "Missing file"
                    : "External package"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-2">{getImportTypeBadge()}</div>

        {!isLocal &&
          dependencyInfo.packageName &&
          dependencyInfo.packageName !== name && (
            <div className="mb-2">
              <div className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                Package: {dependencyInfo.packageName}
              </div>
            </div>
          )}

        {isLocal && dependencyInfo.relativePath && (
          <div className="mb-2">
            <div
              className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded truncate"
              title={dependencyInfo.relativePath}
            >
              {truncateName(dependencyInfo.relativePath, 30)}
            </div>
          </div>
        )}

        {getSpecifiersBadges()}

        {dependencyInfo.isAlias && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              Path Alias
            </Badge>
          </div>
        )}

        {/* Display dependency IDs for debugging */}
        {data.dependencyId && (
          <div className="mt-2">
            <div className="text-xs text-gray-500 font-mono">
              ID: {data.dependencyId.substring(0, 8)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Enhanced Folder Node Component
const FolderNode = ({ data }) => {
  const getRouteTypeColor = () => {
    if (!data.routingAnalysis)
      return "from-gray-50 to-gray-100 border-gray-300";

    switch (data.routingAnalysis.type) {
      case "route-group":
        return "from-purple-50 to-purple-100 border-purple-300";
      case "private-folder":
        return "from-red-50 to-red-100 border-red-300";
      case "dynamic-route":
        return "from-blue-50 to-blue-100 border-blue-300";
      case "catch-all-route":
      case "optional-catch-all-route":
        return "from-green-50 to-green-100 border-green-300";
      case "parallel-route":
        return "from-orange-50 to-orange-100 border-orange-300";
      case "intercepting-route":
        return "from-pink-50 to-pink-100 border-pink-300";
      case "static-route":
        return "from-blue-50 to-blue-100 border-blue-300";
      default:
        return "from-gray-50 to-gray-100 border-gray-300";
    }
  };

  const getRouteIcon = () => {
    if (!data.routingAnalysis)
      return <Folder className="h-4 w-4 text-gray-600" />;

    switch (data.routingAnalysis.type) {
      case "route-group":
        return <Layers className="h-4 w-4 text-purple-600" />;
      case "private-folder":
        return <Lock className="h-4 w-4 text-red-600" />;
      case "dynamic-route":
      case "catch-all-route":
      case "optional-catch-all-route":
        return <Route className="h-4 w-4 text-blue-600" />;
      case "parallel-route":
        return <GitBranch className="h-4 w-4 text-orange-600" />;
      case "intercepting-route":
        return <Eye className="h-4 w-4 text-pink-600" />;
      default:
        return data.isExpanded ? (
          <FolderOpen className="h-4 w-4 text-blue-600" />
        ) : (
          <Folder className="h-4 w-4 text-blue-600" />
        );
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (data.onToggle) {
      data.onToggle(data.nodeId);
    }
  };

  const renderSpecialFilesBadges = () => {
    if (!data.specialFiles) return null;

    const badges = [];
    if (data.specialFiles.hasPage)
      badges.push({ label: "Page", color: "bg-green-100 text-green-800" });
    if (data.specialFiles.hasLayout)
      badges.push({ label: "Layout", color: "bg-blue-100 text-blue-800" });
    if (data.specialFiles.hasApiRoute)
      badges.push({ label: "API", color: "bg-purple-100 text-purple-800" });
    if (data.specialFiles.hasLoading)
      badges.push({ label: "Loading", color: "bg-yellow-100 text-yellow-800" });
    if (data.specialFiles.hasError)
      badges.push({ label: "Error", color: "bg-red-100 text-red-800" });

    return badges.slice(0, 3).map((badge, idx) => (
      <Badge key={idx} className={`text-xs ${badge.color}`}>
        {badge.label}
      </Badge>
    ));
  };

  return (
    <Card
      className={`folder-node min-w-[280px] shadow-lg bg-gradient-to-br ${getRouteTypeColor()} cursor-pointer transition-all hover:shadow-xl`}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {data.isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {getRouteIcon()}
            <CardTitle className="text-sm font-semibold truncate">
              {data.name}
            </CardTitle>
          </div>
        </div>

        {data.routingAnalysis && (
          <div className="space-y-1">
            <Badge variant="outline" className="text-xs">
              {data.routingAnalysis.routingType}
            </Badge>
            {data.routePath && (
              <div className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                {data.routePath}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1">{renderSpecialFilesBadges()}</div>
      </CardHeader>

      {data.routingAnalysis && (
        <CardContent className="pt-0 pb-2">
          <div className="text-xs text-gray-500">
            {data.routingAnalysis.description}
          </div>
        </CardContent>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
};

// Enhanced File Node Component with Dependency Analysis
const FileNode = ({ data }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzedDeps, setHasAnalyzedDeps] = useState(false);

  const getFileColor = () => {
    if (!data.fileAnalysis) return "from-gray-50 to-gray-100 border-gray-300";

    switch (data.fileAnalysis.type) {
      case "page-file":
        return "from-green-50 to-green-100 border-green-300";
      case "layout-file":
        return "from-blue-50 to-blue-100 border-blue-300";
      case "api-route-file":
        return "from-purple-50 to-purple-100 border-purple-300";
      case "loading-file":
        return "from-yellow-50 to-yellow-100 border-yellow-300";
      case "error-file":
        return "from-red-50 to-red-100 border-red-300";
      case "not-found-file":
        return "from-orange-50 to-orange-100 border-orange-300";
      default:
        return "from-gray-50 to-gray-100 border-gray-300";
    }
  };

  const getFileIcon = () => {
    if (!data.fileAnalysis) return <File className="h-4 w-4 text-gray-600" />;

    switch (data.fileAnalysis.type) {
      case "page-file":
        return <Globe className="h-4 w-4 text-green-600" />;
      case "layout-file":
        return <Layers className="h-4 w-4 text-blue-600" />;
      case "api-route-file":
        return <Code className="h-4 w-4 text-purple-600" />;
      case "loading-file":
        return <Zap className="h-4 w-4 text-yellow-600" />;
      case "error-file":
        return <File className="h-4 w-4 text-red-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMethodBadgeColor = (method) => {
    switch (method) {
      case "GET":
        return "bg-blue-100 text-blue-800";
      case "POST":
        return "bg-green-100 text-green-800";
      case "PUT":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "PATCH":
        return "bg-orange-100 text-orange-800";
      case "HEAD":
        return "bg-gray-100 text-gray-800";
      case "OPTIONS":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAnalyzeClick = async (e) => {
    e.stopPropagation();

    if (hasAnalyzedDeps || isAnalyzing) return;

    setIsAnalyzing(true);

    console.log("Analyzing dependencies for file:", data.name);
    console.log("File path:", data.filePath);
    console.log("Project root:", data.projectRoot);

    try {
      const response = await fetch("/api/analyze-dependencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePath: data.filePath,
          projectRoot: data.projectRoot,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze dependencies: ${response.status}`);
      }

      const dependencyData = await response.json();
      console.log("Received dependency data:", dependencyData);

      if (data.onAnalyzeDependencies) {
        console.log(
          "Calling onAnalyzeDependencies with:",
          data.nodeId,
          dependencyData
        );
        data.onAnalyzeDependencies(data.nodeId, dependencyData);
        setHasAnalyzedDeps(true);
      } else {
        console.error("onAnalyzeDependencies callback not found");
      }
    } catch (error) {
      console.error("Error analyzing dependencies:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card
      className={`file-node min-w-[220px] shadow-md bg-gradient-to-br ${getFileColor()}`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <CardContent className="p-3">
        <div className="flex items-center space-x-2 mb-2">
          {getFileIcon()}
          <div className="flex-1">
            <div className="font-semibold text-sm truncate">{data.name}</div>
          </div>
        </div>

        {data.fileAnalysis && (
          <div className="space-y-2">
            <Badge variant="outline" className="text-xs">
              {data.fileAnalysis.purpose}
            </Badge>

            {data.fileAnalysis.apiMethods &&
              data.fileAnalysis.apiMethods.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {data.fileAnalysis.apiMethods.map((method, index) => (
                    <span
                      key={index}
                      className={`inline-block text-xs font-mono px-1.5 py-0.5 rounded ${getMethodBadgeColor(
                        method
                      )}`}
                    >
                      {method}
                    </span>
                  ))}
                </div>
              )}

            <div className="text-xs text-gray-600">
              {data.fileAnalysis.description}
            </div>
          </div>
        )}

        <div className="mt-3 text-right">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAnalyzeClick}
            disabled={isAnalyzing || hasAnalyzedDeps}
            className="h-7 text-xs"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Analyzing...
              </>
            ) : hasAnalyzedDeps ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1.5" />
                Analyzed
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3 mr-1.5" />
                Analyze Deps
              </>
            )}
          </Button>
        </div>
      </CardContent>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
};

export default function EnhancedTreeFlowComponent({ analysisData }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [analyzedFiles, setAnalyzedFiles] = useState(new Set());

  console.log("Analysis Data:", analysisData);

  // Initialize with first layer expanded
  useEffect(() => {
    if (analysisData?.data?.structure?.children) {
      const firstLayerNodes = new Set();
      firstLayerNodes.add("root");

      analysisData.data.structure.children.forEach((child) => {
        if (child.type === "folder") {
          firstLayerNodes.add(`root-${child.name}`);
        }
      });

      setExpandedNodes(firstLayerNodes);
    }
  }, [analysisData]);

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

  const { nodes, edges } = useMemo(() => {
    if (!analysisData?.data?.structure) {
      return { nodes: [], edges: [] };
    }

    return buildTreeLayout(
      analysisData.data.structure,
      expandedNodes,
      toggleNode,
      null // We'll set this callback after the flow nodes are initialized
    );
  }, [analysisData, expandedNodes, toggleNode]);

  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Helper function to create dependency nodes
  const createDependencyNodes = useCallback(
    (dependencies, parentFileNodeId, parentPosition) => {
      console.log(
        "Creating dependency nodes for:",
        parentFileNodeId,
        dependencies
      );

      const nodes = [];
      const edges = [];

      const { localDependencies, externalDependencies } = dependencies;
      const allDeps = [
        ...(localDependencies || []),
        ...(externalDependencies || []),
      ];

      console.log("All dependencies to create:", allDeps);

      const startY = parentPosition.y + 200;
      const nodeSpacing = 300;
      const rowSize = 3;

      allDeps.forEach((dep, index) => {
        const row = Math.floor(index / rowSize);
        const col = index % rowSize;

        const x = parentPosition.x + (col - (rowSize - 1) / 2) * nodeSpacing;
        const y = startY + row * 180;

        // Use the dependency's stable nodeId from the backend
        const nodeId = `${parentFileNodeId}-dep-${
          dep.nodeId || dep.uiId || index
        }`;

        console.log("Creating dependency node:", nodeId, dep.name);

        const dependencyNode = {
          id: nodeId,
          type: "dependency",
          position: { x, y },
          data: {
            name: dep.name,
            type: "dependency",
            dependencyInfo: dep,
            isLocal: dep.isLocal,
            exists: dep.exists,
            resolvedPath: dep.resolvedPath,
            packageName: dep.packageName,
            importType: dep.type,
            specifiers: dep.specifiers,
            dependencyId: dep.id, // Stable hash-based ID from backend
            nodeId: dep.nodeId, // Unique node ID from backend
            uiId: dep.uiId, // UI-specific ID from backend
          },
          draggable: true,
        };

        nodes.push(dependencyNode);

        // Create unique edge ID using dependency's stable ID
        const edgeId = `edge-${parentFileNodeId}-${
          dep.nodeId || dep.uiId || index
        }`;
        const edge = {
          id: edgeId,
          source: parentFileNodeId,
          target: nodeId,
          type: "smoothstep",
          style: {
            stroke: dep.isLocal ? "#10b981" : "#6366f1",
            strokeWidth: 2,
            strokeDasharray: dep.isLocal ? "0" : "5,5",
          },
          label: dep.type,
          labelStyle: { fontSize: 12, fontWeight: 600 },
          labelBgStyle: { fill: "#ffffff", fillOpacity: 0.8 },
          data: {
            dependencyId: dep.id,
            edgeType: dep.type,
          },
        };

        edges.push(edge);
      });

      console.log(
        "Created nodes:",
        nodes.length,
        "Created edges:",
        edges.length
      );
      return { nodes, edges };
    },
    []
  );

  // Callback for handling dependency analysis
  const handleDependencyAnalysis = useCallback(
    (fileNodeId, dependencyData) => {
      console.log(
        "handleDependencyAnalysis called with:",
        fileNodeId,
        dependencyData
      );

      // Check if already analyzed to prevent duplicates
      if (analyzedFiles.has(fileNodeId)) {
        console.log("Dependencies already analyzed for:", fileNodeId);
        return;
      }

      // Mark as analyzed immediately
      setAnalyzedFiles((prev) => new Set(prev).add(fileNodeId));

      // Extract dependencies from the API response structure
      const dependencies = dependencyData?.data || dependencyData;
      console.log("Extracted dependencies:", dependencies);

      // Update nodes first, then edges
      setNodes((prevNodes) => {
        console.log("Previous nodes count:", prevNodes.length);

        // Find the file node position
        const fileNode = prevNodes.find((node) => node.id === fileNodeId);
        if (!fileNode) {
          console.error("File node not found:", fileNodeId);
          return prevNodes;
        }

        console.log("Found file node:", fileNode);

        // Check if dependency nodes already exist for this file
        const existingDepNodes = prevNodes.filter((node) =>
          node.id.includes(`${fileNodeId}-dep-`)
        );

        if (existingDepNodes.length > 0) {
          console.log(
            "Dependency nodes already exist for:",
            fileNodeId,
            existingDepNodes
          );
          return prevNodes;
        }

        // Create dependency nodes
        const { nodes: depNodes, edges: depEdges } = createDependencyNodes(
          dependencies,
          fileNodeId,
          fileNode.position
        );

        console.log("Adding dependency nodes:", depNodes.length);

        // Add edges separately
        setEdges((prevEdges) => {
          console.log("Previous edges count:", prevEdges.length);
          console.log("Adding dependency edges:", depEdges.length);
          return [...prevEdges, ...depEdges];
        });

        // Return updated nodes
        return [...prevNodes, ...depNodes];
      });
    },
    [setNodes, setEdges, createDependencyNodes, analyzedFiles]
  );

  useEffect(() => {
    if (analysisData?.data?.structure) {
      const { nodes: newNodes, edges: newEdges } = buildTreeLayout(
        analysisData.data.structure,
        expandedNodes,
        toggleNode,
        handleDependencyAnalysis
      );
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [
    analysisData,
    expandedNodes,
    setNodes,
    setEdges,
    toggleNode,
    handleDependencyAnalysis,
  ]);

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
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">No project data available</p>
          <p className="text-sm text-gray-400">
            Upload a Next.js project to see the App Router structure
          </p>
        </div>
      </div>
    );
  }

  const insights = analysisData.data.insights;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Next.js App Router Structure
                </h1>
                <p className="text-sm text-gray-600">
                  {insights?.appRouterDetected
                    ? "App Router detected"
                    : "Traditional structure"}
                </p>
              </div>
            </div>
          </div>

          {insights && (
            <div className="flex flex-wrap gap-2">
              {insights.routeCount > 0 && (
                <Badge className="bg-green-100 text-green-800">
                  <Globe className="w-3 h-3 mr-1" />
                  {insights.routeCount} Routes
                </Badge>
              )}
              {insights.apiEndpointCount > 0 && (
                <Badge className="bg-purple-100 text-purple-800">
                  <Code className="w-3 h-3 mr-1" />
                  {insights.apiEndpointCount} API Endpoints
                </Badge>
              )}
              {insights.routePatterns.dynamic > 0 && (
                <Badge className="bg-blue-100 text-blue-800">
                  <Route className="w-3 h-3 mr-1" />
                  {insights.routePatterns.dynamic} Dynamic Routes
                </Badge>
              )}
              {insights.routePatterns.routeGroups > 0 && (
                <Badge className="bg-purple-100 text-purple-800">
                  <Layers className="w-3 h-3 mr-1" />
                  {insights.routePatterns.routeGroups} Route Groups
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 100 }}
          attributionPosition="top-right"
          className="bg-gray-50"
          minZoom={0.1}
          maxZoom={2}
        >
          <Controls className="shadow-lg" />
          <MiniMap
            className="shadow-lg border rounded"
            nodeStrokeWidth={2}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Background variant="dots" gap={20} size={1} color="#e5e7eb" />
        </ReactFlow>
      </div>
    </div>
  );
}

function buildTreeLayout(
  rootData,
  expandedNodes,
  toggleNode,
  onAnalyzeDependencies
) {
  const nodes = [];
  const edges = [];

  function createNodeId(path) {
    return path.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-");
  }

  function calculateTreeDimensions(nodeData, path, level = 0) {
    const nodeId = createNodeId(path);
    const isExpanded = expandedNodes.has(nodeId);

    if (!isExpanded || !nodeData.children) {
      return { width: 300, height: 120 };
    }

    const childFolders = nodeData.children.filter(
      (child) => child.type === "folder"
    );
    const childFiles = nodeData.children.filter(
      (child) => child.type === "file"
    );

    let totalWidth = 0;
    let maxHeight = 120;

    childFolders.forEach((child) => {
      const childPath = `${path}-${child.name}`;
      const childDim = calculateTreeDimensions(child, childPath, level + 1);
      totalWidth += childDim.width + 50;
      maxHeight = Math.max(maxHeight, childDim.height);
    });

    if (childFiles.length > 0) {
      totalWidth += childFiles.length * 240;
    }

    return {
      width: Math.max(totalWidth, 300),
      height: maxHeight + 280,
    };
  }

  function processNode(
    nodeData,
    path,
    parentId,
    level,
    centerX,
    topY,
    projectRoot
  ) {
    const nodeId = createNodeId(path);
    const isExpanded = expandedNodes.has(nodeId);

    const childFolders = nodeData.children
      ? nodeData.children.filter((child) => child.type === "folder")
      : [];
    const childFiles = nodeData.children
      ? nodeData.children.filter((child) => child.type === "file")
      : [];

    if (nodeData.type === "folder") {
      const folderNode = {
        id: nodeId,
        type: "folder",
        position: { x: centerX - 140, y: topY },
        data: {
          name: nodeData.name,
          type: "folder",
          isExpanded,
          isAppRouter: nodeData.isAppRouter,
          routingAnalysis: nodeData.routingAnalysis,
          routePath: nodeData.routePath,
          specialFiles: nodeData.specialFiles,
          fileCount: childFiles.length,
          folderCount: childFolders.length,
          nodeId: nodeId,
          onToggle: toggleNode,
        },
        draggable: true,
      };

      nodes.push(folderNode);

      // Create edge from parent
      if (parentId) {
        const edgeColor = nodeData.isAppRouter ? "#3b82f6" : "#6b7280";
        edges.push({
          id: `edge-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: "smoothstep",
          style: {
            stroke: edgeColor,
            strokeWidth: nodeData.isAppRouter ? 3 : 2,
          },
        });
      }
    }

    // Process children if expanded
    if (isExpanded && (childFolders.length > 0 || childFiles.length > 0)) {
      const childY = topY + 280;
      let currentX = centerX;

      // Calculate total width needed
      let totalChildWidth = 0;
      childFolders.forEach((child) => {
        const childPath = `${path}-${child.name}`;
        const childDim = calculateTreeDimensions(child, childPath, level + 1);
        totalChildWidth += childDim.width + 50;
      });
      totalChildWidth += childFiles.length * 240;

      // Start from left edge
      let childX = centerX - totalChildWidth / 2;

      // Process child folders
      childFolders.forEach((child) => {
        const childPath = `${path}-${child.name}`;
        const childDim = calculateTreeDimensions(child, childPath, level + 1);
        const childCenterX = childX + childDim.width / 2;

        processNode(
          child,
          childPath,
          nodeId,
          level + 1,
          childCenterX,
          childY,
          projectRoot
        );
        childX += childDim.width + 50;
      });

      // Process files as nodes
      childFiles.forEach((file, index) => {
        const fileNodeId = `${nodeId}-file-${index}`;
        const fileX = childX + 120;

        // Use the actual file path from the analysis data
        const filePath = file.fullPath || "";

        const fileNode = {
          id: fileNodeId,
          type: "file",
          position: { x: fileX - 110, y: childY },
          data: {
            name: file.name,
            type: "file",
            isAppRouter: file.isAppRouter,
            fileAnalysis: file.fileAnalysis,
            filePath: filePath,
            projectRoot: projectRoot,
            nodeId: fileNodeId,
            onAnalyzeDependencies: onAnalyzeDependencies,
          },
          draggable: true,
        };

        nodes.push(fileNode);

        const edgeColor = file.isAppRouter ? "#10b981" : "#6b7280";
        edges.push({
          id: `edge-${nodeId}-${fileNodeId}`,
          source: nodeId,
          target: fileNodeId,
          type: "smoothstep",
          style: {
            stroke: edgeColor,
            strokeWidth: file.isAppRouter ? 2.5 : 1.5,
          },
        });

        childX += 240;
      });
    }
  }

  // Start with root node - pass project root for file path construction
  const projectRoot = rootData.projectRoot || "";
  processNode(rootData, "root", null, 0, 0, 100, projectRoot);

  return { nodes, edges };
}
