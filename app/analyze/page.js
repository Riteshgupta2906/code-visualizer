"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EnhancedTreeFlowComponent from "./_components/codeFlow";
import CombinedSidebar from "./_components/ProjectSideBar/sideBar";
import {
  Loader2,
  Home,
  RefreshCw,
  AlertTriangle,
  FileText,
  Globe,
  FolderOpen,
  Code,
  Route,
  Layers,
  Activity,
  Zap,
  Menu,
} from "lucide-react";

export default function AnalyzePage() {
  const searchParams = useSearchParams();
  const projectPath = searchParams.get("path");
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true); // Open by default

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
      };
    }

    const counts = countItems(analysisData.data.structure);
    const insights = analysisData.data.insights || {};

    return {
      totalFiles: counts.files,
      totalFolders: counts.folders,
      projectName: analysisData.data.structure.name || "Unknown Project",
      hasAppRouter: insights.appRouterDetected || false,
      routeCount: insights.routeCount || 0,
      apiEndpoints: insights.apiEndpointCount || 0,
      dynamicRoutes: insights.routePatterns?.dynamic || 0,
      routeGroups: insights.routePatterns?.routeGroups || 0,
    };
  };

  const projectStats = getProjectStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl border border-gray-800 bg-gray-900/95 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <div className="absolute inset-0 w-16 h-16 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl animate-pulse opacity-20"></div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  Analyzing Next.js Project
                </h2>
                <p className="text-gray-400">
                  Scanning App Router structure, API routes, and routing
                  patterns...
                </p>
              </div>
              <div className="flex justify-center">
                <Badge
                  variant="secondary"
                  className="animate-pulse bg-gray-800 text-gray-300 border-gray-700"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  Detecting HTTP methods in route files
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl border border-gray-800 bg-gray-900/95 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-red-900/50 rounded-2xl flex items-center justify-center border border-red-800">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  Analysis Failed
                </h2>
                <Alert
                  variant="destructive"
                  className="text-left bg-red-900/20 border-red-800 text-red-400"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
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
      {/* Toggle Button - Fixed position when sidebar is closed */}
      {!sidebarOpen && (
        <div className="fixed top-4 left-4 z-20">
          <Button
            onClick={() => setSidebarOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main Visualization Area */}
      <div className="flex-1 relative">
        <EnhancedTreeFlowComponent analysisData={analysisData} />

        {/* Combined Sidebar */}
        <CombinedSidebar
          structure={analysisData.data.structure}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          projectStats={projectStats}
          projectPath={projectPath}
        />
      </div>
    </div>
  );
}
