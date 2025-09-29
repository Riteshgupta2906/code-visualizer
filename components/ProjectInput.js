"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Folder, ArrowRight } from "lucide-react";

export default function ProjectInput() {
  const [projectPath, setProjectPath] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!projectPath.trim()) {
      setError("Please enter a valid project path");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectPath: projectPath.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      // Navigate to analysis results
      router.push(`/analyze?path=${encodeURIComponent(projectPath)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExampleProject = () => {
    setProjectPath("/Users/yourname/projects/my-next-app");
  };

  return (
    <div className="relative">
      {/* Background gradient for glass effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-700/20 via-gray-800/10 to-gray-900/20 blur-xl transform rotate-1"></div>

      <Card className="border border-gray-700/30 shadow-2xl bg-gray-800/40 backdrop-blur-md relative z-10 rounded-2xl overflow-hidden">
        {/* Subtle animated background patterns */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-600/10 to-transparent rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-slate-700/10 to-transparent rounded-full blur-xl"></div>
        </div>

        <CardHeader className="pb-6 relative z-20">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-white">
            <div className="p-2 bg-slate-700/30 backdrop-blur-sm rounded-lg border border-slate-600/40">
              <Folder className="w-6 h-6 text-slate-400" />
            </div>
            Analyze Your Project
          </CardTitle>
          <p className="text-gray-300 mt-2">
            Enter your Next.js project path to get started with comprehensive
            code analysis
          </p>
        </CardHeader>

        <CardContent className="space-y-6 relative z-20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="projectPath"
                className="text-base font-medium text-gray-200"
              >
                Next.js Project Path
              </Label>
              <div className="relative">
                <Input
                  id="projectPath"
                  type="text"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  placeholder="/path/to/your/nextjs-project"
                  className="h-12 pl-12 text-base border-2 border-gray-600/40 bg-gray-700/30 backdrop-blur-lg text-white placeholder-gray-400 focus:border-slate-500/50 focus:bg-gray-700/50 transition-all duration-200"
                  disabled={isAnalyzing}
                />
                <Folder className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Enter the absolute path to your Next.js project with App Router
              </p>
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="border-red-800/40 bg-red-900/20 backdrop-blur-lg"
              >
                <svg
                  className="w-4 h-4 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <AlertDescription className="text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={isAnalyzing}
                className="flex-1 h-12 bg-slate-700 hover:bg-slate-600 text-white font-medium shadow-lg shadow-slate-700/30 transition-all duration-200"
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Project...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Start Analysis
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <Button
                type="button"
                onClick={handleExampleProject}
                disabled={isAnalyzing}
                variant="outline"
                className="h-12 px-6 border-2 border-gray-600/40 bg-gray-700/30 backdrop-blur-lg text-gray-200 hover:border-gray-500/50 hover:bg-gray-600/40 hover:text-white font-medium transition-all duration-200"
              >
                Use Example
              </Button>
            </div>
          </form>

          <div className="pt-4 border-t border-gray-700/30">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 bg-green-600/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-green-500/30">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-300">
                  Safe & Secure
                </span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 bg-slate-600/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-slate-500/30">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-300">
                  Fast Analysis
                </span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 bg-slate-600/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-slate-500/30">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 4 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-300">
                  Detailed Reports
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
