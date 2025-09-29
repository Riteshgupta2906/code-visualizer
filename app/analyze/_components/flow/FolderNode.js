import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Route,
  Lock,
  Eye,
  Layers,
  GitBranch,
  Server,
  Database,
} from "lucide-react";

const FolderNode = ({ data }) => {
  const isApiFolder = () => {
    return (
      data.name === "api" ||
      data.name.includes("api") ||
      data.specialFiles?.hasApiRoute ||
      data.routingAnalysis?.type === "api-route" ||
      data.routePath?.includes("/api/")
    );
  };

  const getRouteTypeColor = () => {
    // Dark glass morphism styling
    if (isApiFolder()) {
      return "bg-gray-800/40 backdrop-blur-md border border-indigo-500/30 shadow-2xl shadow-indigo-500/20";
    }

    if (!data.routingAnalysis)
      return "bg-gray-800/30 backdrop-blur-md border border-gray-600/20 shadow-xl";

    switch (data.routingAnalysis.type) {
      case "route-group":
        return "bg-gray-800/40 backdrop-blur-md border border-purple-500/30 shadow-xl shadow-purple-500/10";
      case "private-folder":
        return "bg-gray-800/40 backdrop-blur-md border border-red-500/30 shadow-xl shadow-red-500/10";
      case "dynamic-route":
        return "bg-gray-800/40 backdrop-blur-md border border-blue-500/30 shadow-xl shadow-blue-500/10";
      case "catch-all-route":
      case "optional-catch-all-route":
        return "bg-gray-800/40 backdrop-blur-md border border-green-500/30 shadow-xl shadow-green-500/10";
      case "parallel-route":
        return "bg-gray-800/40 backdrop-blur-md border border-orange-500/30 shadow-xl shadow-orange-500/10";
      case "intercepting-route":
        return "bg-gray-800/40 backdrop-blur-md border border-pink-500/30 shadow-xl shadow-pink-500/10";
      case "static-route":
        return "bg-gray-800/40 backdrop-blur-md border border-blue-500/30 shadow-xl shadow-blue-500/10";
      default:
        return "bg-gray-800/30 backdrop-blur-md border border-gray-600/20 shadow-xl";
    }
  };

  const getRouteIcon = () => {
    if (isApiFolder()) {
      return <Server className="h-4 w-4 text-indigo-400" />;
    }

    if (!data.routingAnalysis)
      return <Folder className="h-4 w-4 text-gray-400" />;

    switch (data.routingAnalysis.type) {
      case "route-group":
        return <Layers className="h-4 w-4 text-purple-400" />;
      case "private-folder":
        return <Lock className="h-4 w-4 text-red-400" />;
      case "dynamic-route":
      case "catch-all-route":
      case "optional-catch-all-route":
        return <Route className="h-4 w-4 text-blue-400" />;
      case "parallel-route":
        return <GitBranch className="h-4 w-4 text-orange-400" />;
      case "intercepting-route":
        return <Eye className="h-4 w-4 text-pink-400" />;
      default:
        return data.isExpanded ? (
          <FolderOpen className="h-4 w-4 text-blue-400" />
        ) : (
          <Folder className="h-4 w-4 text-blue-400" />
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
      badges.push({
        label: "Page",
        color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      });
    if (data.specialFiles.hasLayout)
      badges.push({
        label: "Layout",
        color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      });
    if (data.specialFiles.hasApiRoute)
      badges.push({
        label: "API",
        color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      });
    if (data.specialFiles.hasLoading)
      badges.push({
        label: "Loading",
        color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      });
    if (data.specialFiles.hasError)
      badges.push({
        label: "Error",
        color: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      });

    return badges.slice(0, 3).map((badge, idx) => (
      <Badge
        key={idx}
        className={`text-xs backdrop-blur-sm border ${badge.color}`}
      >
        {badge.label}
      </Badge>
    ));
  };

  return (
    <div className="relative">
      {/* Background gradient for dark glass effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gray-700/20 via-gray-800/10 to-gray-900/20 blur-xl transform rotate-1"></div>

      <Card
        className={`folder-node min-w-[280px] ${getRouteTypeColor()} cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-gray-700/50 rounded-xl overflow-hidden relative z-10`}
        onClick={handleClick}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-gray-600/50 backdrop-blur-sm border border-gray-500/30"
        />

        {/* Subtle animated background patterns */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gray-600/10 to-transparent rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-gray-700/10 to-transparent rounded-full blur-xl"></div>
          {isApiFolder() && (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-indigo-600/10 animate-pulse"></div>
          )}
        </div>

        <CardHeader className="pb-2 relative z-20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700/30 backdrop-blur-lg border border-gray-600/40">
                {data.isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-300" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                )}
              </div>
              <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-700/40 backdrop-blur-lg border border-gray-600/50">
                {getRouteIcon()}
              </div>
              <CardTitle className="text-sm font-semibold truncate text-gray-100 drop-shadow-sm">
                {data.name}
              </CardTitle>
            </div>
            {isApiFolder() && (
              <div className="flex items-center space-x-1 bg-gray-700/40 backdrop-blur-lg px-2 py-1 rounded-full border border-indigo-500/40 shadow-lg">
                <Database className="h-3 w-3 text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-300">
                  API
                </span>
              </div>
            )}
          </div>

          {data.routingAnalysis && (
            <div className="space-y-1">
              <Badge
                variant="outline"
                className="text-xs bg-gray-700/30 backdrop-blur-lg border-gray-600/40 text-gray-200"
              >
                {data.routingAnalysis.routingType}
              </Badge>
              {data.routePath && (
                <div className="text-xs text-gray-300 font-mono bg-black/20 backdrop-blur-lg px-2 py-1 rounded border border-gray-600/30">
                  <span className="text-gray-400 mr-1">→</span>
                  {data.routePath}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {renderSpecialFilesBadges()}
          </div>
        </CardHeader>

        {/* {data.routingAnalysis && (
          <CardContent className="pt-0 pb-2 relative z-20">
            <div className="text-xs text-gray-300 bg-gray-800/20 backdrop-blur-lg rounded-lg px-2 py-1 border border-gray-600/25">
              {data.routingAnalysis.description}
            </div>
          </CardContent>
        )} */}

        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-gray-600/50 backdrop-blur-sm border border-gray-500/30"
        />
      </Card>
    </div>
  );
};

export default FolderNode;
