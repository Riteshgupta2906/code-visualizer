import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
      return <Server className="h-3 w-3 text-indigo-400" />;
    }

    if (!data.routingAnalysis)
      return <Folder className="h-3 w-3 text-gray-400" />;

    switch (data.routingAnalysis.type) {
      case "route-group":
        return <Layers className="h-3 w-3 text-purple-400" />;
      case "private-folder":
        return <Lock className="h-3 w-3 text-red-400" />;
      case "dynamic-route":
      case "catch-all-route":
      case "optional-catch-all-route":
        return <Route className="h-3 w-3 text-blue-400" />;
      case "parallel-route":
        return <GitBranch className="h-3 w-3 text-orange-400" />;
      case "intercepting-route":
        return <Eye className="h-3 w-3 text-pink-400" />;
      default:
        return data.isExpanded ? (
          <FolderOpen className="h-3 w-3 text-blue-400" />
        ) : (
          <Folder className="h-3 w-3 text-blue-400" />
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

    return badges.slice(0, 2).map((badge, idx) => (
      <Badge
        key={idx}
        className={`text-[10px] px-1.5 py-0 backdrop-blur-sm border ${badge.color}`}
      >
        {badge.label}
      </Badge>
    ));
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="relative">
            {/* Background gradient for dark glass effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gray-700/20 via-gray-800/10 to-gray-900/20 blur-lg transform rotate-1"></div>

            <Card
              className={`folder-node min-w-[220px] max-w-[260px] ${getRouteTypeColor()} cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-gray-700/50 rounded-lg overflow-hidden relative z-10`}
              onClick={handleClick}
            >
              {/* LEFT HANDLE - Input from parent */}
              <Handle
                type="target"
                position={Position.Left}
                className="w-2.5 h-2.5 bg-gray-600/50 backdrop-blur-sm border border-gray-500/30"
              />

              {/* Subtle animated background patterns */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-600/10 to-transparent rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-gray-700/10 to-transparent rounded-full blur-xl"></div>
                {isApiFolder() && (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-indigo-600/10 animate-pulse"></div>
                )}
              </div>

              <CardHeader className="py-1 px-3 relative z-20 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-700/30 backdrop-blur-lg border border-gray-600/40 flex-shrink-0">
                      {data.isExpanded ? (
                        <ChevronDown className="h-2.5 w-2.5 text-gray-300" />
                      ) : (
                        <ChevronRight className="h-2.5 w-2.5 text-gray-300" />
                      )}
                    </div>
                    <div className="flex items-center justify-center w-4 h-4 rounded-lg bg-gray-700/40 backdrop-blur-lg border border-gray-600/50 flex-shrink-0">
                      {getRouteIcon()}
                    </div>
                    <CardTitle className="text-xs font-semibold truncate text-gray-100 drop-shadow-sm">
                      {data.name}
                    </CardTitle>
                    <div className="flex gap-0.5 flex-shrink-0">
                      {renderSpecialFilesBadges()}
                    </div>
                  </div>
                  {isApiFolder() && (
                    <div className="flex items-center space-x-0.5 bg-gray-700/40 backdrop-blur-lg px-1.5 py-0.5 rounded-full border border-indigo-500/40 shadow-lg flex-shrink-0">
                      <Database className="h-2.5 w-2.5 text-indigo-400" />
                      <span className="text-[10px] font-semibold text-indigo-300">
                        API
                      </span>
                    </div>
                  )}
                </div>

                {data.routingAnalysis && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-gray-700/30 backdrop-blur-lg border-gray-600/40 text-gray-200"
                    >
                      {data.routingAnalysis.routingType}
                    </Badge>
                    {data.routePath && (
                      <div className="text-[10px] text-gray-300 font-mono bg-black/20 backdrop-blur-lg px-1.5 py-0.5 rounded border border-gray-600/30 truncate">
                        <span className="text-gray-400 mr-0.5">→</span>
                        {data.routePath}
                      </div>
                    )}
                  </div>
                )}
              </CardHeader>

              {/* RIGHT HANDLE - Output to children */}
              <Handle
                type="source"
                position={Position.Right}
                className="w-2.5 h-2.5 bg-gray-600/50 backdrop-blur-sm border border-gray-500/30"
              />
            </Card>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-gray-900/95 backdrop-blur-md border border-gray-700/50 shadow-2xl"
        >
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-gray-200">Full Path:</p>
            <p className="text-xs font-mono text-gray-300 max-w-md break-all">
              {data.fullPath || data.routePath || `/${data.name}`}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FolderNode;
