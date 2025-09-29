import { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  File,
  Globe,
  Code,
  Zap,
  Layers,
  Share2,
  CheckCircle,
  Loader2,
} from "lucide-react";

const FileNode = ({ data }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzedDeps, setHasAnalyzedDeps] = useState(false);

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
    if (!data.fileAnalysis) return <File className="h-4 w-4 text-gray-400" />;

    switch (data.fileAnalysis.type) {
      case "page-file":
        return <Globe className="h-4 w-4 text-green-400" />;
      case "layout-file":
        return <Layers className="h-4 w-4 text-blue-400" />;
      case "api-route-file":
        return <Code className="h-4 w-4 text-purple-400" />;
      case "loading-file":
        return <Zap className="h-4 w-4 text-yellow-400" />;
      case "error-file":
        return <File className="h-4 w-4 text-red-400" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
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

  const handleAnalyzeClick = async (e) => {
    e.stopPropagation();

    if (hasAnalyzedDeps || isAnalyzing) return;

    setIsAnalyzing(true);

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

      if (data.onAnalyzeDependencies) {
        data.onAnalyzeDependencies(data.nodeId, dependencyData);
        setHasAnalyzedDeps(true);
      }
    } catch (error) {
      console.error("Error analyzing dependencies:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative">
      {/* Background gradient for dark glass effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gray-700/15 via-gray-800/10 to-gray-900/15 blur-lg transform rotate-1"></div>

      {/* Tree structure handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 bg-blue-500/80 backdrop-blur-sm border border-blue-400/30"
      />

      {/* Custom dependency output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="dependency-out"
        className="w-4 h-4 bg-purple-500/80 backdrop-blur-sm border-2 border-gray-800"
        style={{
          bottom: "-8px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />

      <Card
        className={`file-node min-w-[220px] ${getFileColor()} relative z-10 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-gray-700/40 rounded-xl overflow-hidden`}
      >
        {/* Subtle animated background patterns */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-600/5 to-transparent rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-gray-700/5 to-transparent rounded-full blur-lg"></div>
        </div>

        <CardContent className="p-3 relative z-20">
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-700/40 backdrop-blur-lg border border-gray-600/50 shadow-sm">
              {getFileIcon()}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm truncate text-gray-100 drop-shadow-sm">
                {data.name}
              </div>
            </div>
          </div>

          {data.fileAnalysis && (
            <div className="space-y-2">
              <Badge
                variant="outline"
                className="text-xs bg-gray-700/30 backdrop-blur-lg border-gray-600/40 text-gray-200"
              >
                {data.fileAnalysis.purpose}
              </Badge>

              {data.fileAnalysis.apiMethods &&
                data.fileAnalysis.apiMethods.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {data.fileAnalysis.apiMethods.map((method, index) => (
                      <span
                        key={index}
                        className={`inline-block text-xs font-mono px-1.5 py-0.5 rounded backdrop-blur-sm border font-semibold ${getMethodBadgeColor(
                          method
                        )}`}
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                )}

              {/* <div className="text-xs text-gray-300 bg-gray-800/20 backdrop-blur-lg rounded-lg px-2 py-1 border border-gray-600/25">
                {data.fileAnalysis.description}
              </div> */}
            </div>
          )}

          <div className="mt-3 text-right">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAnalyzeClick}
              disabled={isAnalyzing || hasAnalyzedDeps}
              className="h-7 text-xs bg-gray-700/30 backdrop-blur-lg border-gray-600/40 text-gray-200 hover:bg-gray-600/40 hover:text-white transition-all duration-200"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Analyzing...
                </>
              ) : hasAnalyzedDeps ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1.5 text-green-400" />
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
      </Card>

      {/* Tree structure handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 bg-blue-500/80 backdrop-blur-sm border border-blue-400/30"
        style={{
          bottom: "-6px",
          right: "20px",
        }}
      />
    </div>
  );
};

export default FileNode;
