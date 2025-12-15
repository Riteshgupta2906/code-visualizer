"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import GraphContainer from "./_components/GraphContainer";
import {
  Loader2,
  Home,
  RefreshCw,
  AlertTriangle,
  FolderOpen,
  Activity,
  FolderX,
} from "lucide-react";

function LoadingState() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      {/* Ambient Background Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-900/20 blur-[120px] -z-10 rounded-full pointer-events-none" />

      <div className="text-center space-y-8 relative z-10">
        {/* Animated Logo/Icon */}
        <div className="relative inline-flex">
          {/* Main Glow Effect */}
          <div className="absolute -inset-4 bg-blue-600/40 blur-[40px] rounded-full opacity-80"></div>
          
          <div className="relative w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-white">
            Analyzing Next.js Project
          </h2>
          <p className="text-gray-400 text-lg font-light max-w-md mx-auto">
            Searching for App Router folder and analyzing structure...
          </p>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-gray-400">
            Detecting App Router patterns
          </span>
        </div>
      </div>
    </div>
  );
}

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const projectPath = searchParams.get("path");
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (projectPath) {
      analyzeProject(projectPath);
    }
  }, [projectPath]);

  const analyzeProject = async (path) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectPath: path }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      // Check if analysis succeeded
      if (!data.success) {
        throw new Error(data.error || "Analysis failed - no app folder found");
      }

      console.log("Analysis Data:", data);
      setAnalysisData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const countItems = (node) => {
    if (!node || !node.children) return { files: 0, folders: 0 };

    let files = 0;
    let folders = 0;

    node.children.forEach((child) => {
      if (child.type === "file") {
        files++;
      } else if (child.type === "folder") {
        folders++;
        const childCounts = countItems(child);
        files += childCounts.files;
        folders += childCounts.folders;
      }
    });

    return { files, folders };
  };

  const getProjectStats = () => {
    if (!analysisData?.success || !analysisData?.data?.structure) {
      return {
        totalFiles: 0,
        totalFolders: 0,
        projectName: "Unknown Project",
        hasAppRouter: false,
        routeCount: 0,
        apiEndpoints: 0,
        dynamicRoutes: 0,
        routeGroups: 0,
        appRouterLocation: null,
      };
    }

    const counts = countItems(analysisData.data.structure);
    const insights = analysisData.data.insights || {};
    const appFolderInfo = analysisData.data.appFolderInfo || {};

    return {
      totalFiles: counts.files,
      totalFolders: counts.folders,
      projectName: analysisData.data.structure.name || "app",
      hasAppRouter: insights.appRouterDetected || true,
      routeCount: insights.routeCount || 0,
      apiEndpoints: insights.apiEndpointCount || 0,
      dynamicRoutes: insights.routePatterns?.dynamic || 0,
      routeGroups: insights.routePatterns?.routeGroups || 0,
      appRouterLocation: appFolderInfo.location || "app",
    };
  };

  const projectStats = getProjectStats();

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    // Check if it's specifically a "no app folder" error
    const isNoAppFolderError = error.toLowerCase().includes("no app router");

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl border border-gray-800 bg-gray-900/95 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className={`w-16 h-16 mx-auto ${isNoAppFolderError ? 'bg-orange-900/50 border-orange-800' : 'bg-red-900/50 border-red-800'} rounded-2xl flex items-center justify-center border`}>
                {isNoAppFolderError ? (
                  <FolderX className="w-8 h-8 text-orange-400" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                )}
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  {isNoAppFolderError ? "No App Router Found" : "Analysis Failed"}
                </h2>
                <Alert
                  variant={isNoAppFolderError ? "default" : "destructive"}
                  className={`text-left ${isNoAppFolderError ? 'bg-orange-900/20 border-orange-800 text-orange-400' : 'bg-red-900/20 border-red-800 text-red-400'}`}
                >
                  {isNoAppFolderError ? (
                    <FolderX className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                {isNoAppFolderError && (
                  <div className="text-left bg-gray-800/50 border border-gray-700 rounded-lg p-4 mt-4">
                    <p className="text-sm text-gray-300 mb-2">This tool requires:</p>
                    <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                      <li>A Next.js project with App Router</li>
                      <li>An <code className="bg-gray-900 px-1 rounded">app</code> folder containing layout or page files</li>
                      <li>Common locations: <code className="bg-gray-900 px-1 rounded">/app</code> or <code className="bg-gray-900 px-1 rounded">/src/app</code></li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => analyzeProject(projectPath)}
                  variant="outline"
                  className="flex-1 border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
                <Button
                  onClick={() => (window.location.href = "/")}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysisData?.success || !analysisData?.data?.structure) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl border border-gray-800 bg-gray-900/95 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-700">
                <FolderOpen className="w-8 h-8 text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                No Analysis Data
              </h2>
              <p className="text-gray-400">
                Unable to analyze the project structure. Please try again.
              </p>
              <Button
                onClick={() => (window.location.href = "/")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Main Visualization Area */}
      <div className="flex-1 relative">
        <GraphContainer
          analysisData={analysisData}
          projectStats={projectStats}
          projectPath={projectPath}
        />
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AnalyzeContent />
    </Suspense>
  );
}