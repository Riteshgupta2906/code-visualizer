import { useState, useEffect, memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  File,
  Globe,
  Code,
  Zap,
  Layers,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";

const FileNode = ({ data }) => {
  // console.log("FileNode data:", data);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeModes, setActiveModes] = useState(
    new Set(data.initialActiveModes || [])
  );

  // Sync state with props (for when global analysis loads)
  useEffect(() => {
    if (data.initialActiveModes) {
      const newModes = new Set(data.initialActiveModes);
      // Only update state if different to rely on React optimization
      setActiveModes((prev) => {
        if (
          prev.size === newModes.size &&
          [...newModes].every((m) => prev.has(m))
        ) {
          return prev;
        }
        return newModes;
      });
    }
  }, [data.initialActiveModes]);

  const getFileColor = () => {
    if (!data.fileAnalysis)
      return "bg-gray-800/30 backdrop-blur-md border border-gray-600/20 shadow-xl";

    switch (data.fileAnalysis.type) {
      case "page-file":
        return "bg-gray-800/40 backdrop-blur-md border border-green-500/30 shadow-xl shadow-green-500/10";
      case "layout-file":
        return "bg-gray-800/40 backdrop-blur-md border border-blue-500/30 shadow-xl shadow-blue-500/10";
      case "api-route-file":
        return "bg-gray-800/40 backdrop-blur-md border border-purple-500/30 shadow-xl shadow-purple-500/10";
      case "loading-file":
        return "bg-gray-800/40 backdrop-blur-md border border-yellow-500/30 shadow-xl shadow-yellow-500/10";
      case "error-file":
        return "bg-gray-800/40 backdrop-blur-md border border-red-500/30 shadow-xl shadow-red-500/10";
      case "not-found-file":
        return "bg-gray-800/40 backdrop-blur-md border border-orange-500/30 shadow-xl shadow-orange-500/10";
      default:
        return "bg-gray-800/30 backdrop-blur-md border border-gray-600/20 shadow-xl";
    }
  };

  const getFileIcon = () => {
    if (!data.fileAnalysis) return <File className="h-3 w-3 text-gray-400" />;

    switch (data.fileAnalysis.type) {
      case "page-file":
        return <Globe className="h-3 w-3 text-green-400" />;
      case "layout-file":
        return <Layers className="h-3 w-3 text-blue-400" />;
      case "api-route-file":
        return <Code className="h-3 w-3 text-purple-400" />;
      case "loading-file":
        return <Zap className="h-3 w-3 text-yellow-400" />;
      case "error-file":
        return <File className="h-3 w-3 text-red-400" />;
      default:
        return <File className="h-3 w-3 text-gray-400" />;
    }
  };

  const getMethodBadgeColor = (method) => {
    switch (method) {
      case "GET":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "POST":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "PUT":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "DELETE":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "PATCH":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "HEAD":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      case "OPTIONS":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const handleAnalyzeClick = async (e, mode) => {
    e.stopPropagation();

    // Toggle mode
    const newModes = new Set(activeModes);
    const isEnabling = !newModes.has(mode);

    if (isEnabling) {
      newModes.add(mode);
    } else {
      newModes.delete(mode);
    }

    setActiveModes(newModes);

    // If disabling, just notify parent to hide
    if (!isEnabling) {
      if (data.onAnalyzeDependencies) {
        data.onAnalyzeDependencies(data.nodeId, null, mode);
      }
      return;
    }

    if (isAnalyzing) return;

    setIsAnalyzing(true);

    if (data.onAnalyzeDependencies) {
      data.onAnalyzeDependencies(data.nodeId, data.filePath, mode);
    }

    setIsAnalyzing(false);
  };

  return (
    <div className="relative">
      {/* Background gradient for dark glass effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gray-700/15 via-gray-800/10 to-gray-900/15 blur-lg transform rotate-1"></div>

      {/* LEFT HANDLE - Tree structure input */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-2.5 h-2.5 bg-blue-500/80 backdrop-blur-sm border border-blue-400/30"
      />

      {/* RIGHT HANDLE - Tree structure output */}
      {/* <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-2.5 h-2.5 bg-blue-500/80 backdrop-blur-sm border border-blue-400/30"
        style={{
          top: "30%",
        }}
      /> */}

      {/* RIGHT HANDLE - Dependency output */}
      <Handle
        type="source"
        position={Position.Right}
        id="dependency-out"
        className="w-3 h-3 bg-purple-500/80 backdrop-blur-sm border-2 border-gray-800"
        // style={{
        //   top: "70%",
        // }}
      />

      <Card
        className={`file-node min-w-[240px] max-w-[280px] ${getFileColor()} relative z-10 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-gray-700/40 rounded-lg`}
      >
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-600/5 to-transparent rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-gray-700/5 to-transparent rounded-full blur-lg"></div>
        </div>

        <CardContent className="py-1 px-3 relative z-20 space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-center w-4 h-4 rounded-lg bg-gray-700/40 backdrop-blur-lg border border-gray-600/50 shadow-sm flex-shrink-0">
                {getFileIcon()}
              </div>
              <div className="font-semibold text-xs truncate text-gray-100 drop-shadow-sm">
                {data.name}
              </div>
              {data.fileAnalysis && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-gray-700/30 backdrop-blur-lg border-gray-600/40 text-gray-200 flex-shrink-0"
                >
                  {data.fileAnalysis.purpose}
                </Badge>
              )}
            </div>
            
            {/* ACTION BUTTONS (Vertical) */}
            <div className="flex flex-col gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-5 w-5 rounded hover:bg-gray-600/50 transition-colors ${
                      activeModes.has("outgoing") ? "text-blue-400 bg-blue-500/10" : "text-gray-400"
                    }`}
                    onClick={(e) => handleAnalyzeClick(e, "outgoing")}
                  >
                    {isAnalyzing && activeModes.has("outgoing") ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-gray-800 text-gray-200 border-gray-700 text-xs">
                  <p>Show Imports</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-5 w-5 rounded hover:bg-gray-600/50 transition-colors ${
                      activeModes.has("incoming") ? "text-purple-400 bg-purple-500/10" : "text-gray-400"
                    }`}
                    onClick={(e) => handleAnalyzeClick(e, "incoming")}
                  >
                    {isAnalyzing && activeModes.has("incoming") ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ArrowLeft className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-gray-800 text-gray-200 border-gray-700 text-xs">
                  <p>Show Usage</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {data.fileAnalysis?.apiMethods &&
            data.fileAnalysis.apiMethods.length > 0 && (
              <div className="flex flex-wrap gap-0.5">
                {data.fileAnalysis.apiMethods.map((method, index) => (
                  <span
                    key={index}
                    className={`inline-block text-[10px] font-mono px-1 py-0 rounded backdrop-blur-sm border font-semibold ${getMethodBadgeColor(
                      method
                    )}`}
                  >
                    {method}
                  </span>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

// Custom comparison function for React.memo
function arePropsEqual(prevProps, nextProps) {
  const prevData = prevProps.data;
  const nextData = nextProps.data;

  // Compare essential primitives
  if (
    prevData.nodeId !== nextData.nodeId ||
    prevData.name !== nextData.name ||
    prevData.filePath !== nextData.filePath ||
    prevData.type !== nextData.type
  ) {
    return false;
  }

  // Deep compare initialActiveModes (they are usually new arrays)
  const prevModes = prevData.initialActiveModes || [];
  const nextModes = nextData.initialActiveModes || [];

  if (prevModes.length !== nextModes.length) return false;

  // Assuming sequence doesn't matter, but for simplicity we can just sort or check if every item is present
  // But usually they come from push() orders. Checking every item is safer.
  if (prevModes.length > 0) {
    const prevSet = new Set(prevModes);
    if (!nextModes.every((m) => prevSet.has(m))) return false;
  }

  return true;
}

export default memo(FileNode, arePropsEqual);
