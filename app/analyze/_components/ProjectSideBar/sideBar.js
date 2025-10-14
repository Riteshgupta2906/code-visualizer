import { useState, useMemo } from "react";
import {
  X,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Folder,
  FolderOpen,
  File,
  Home,
  Globe,
  FileText,
  Code,
  Route,
  Layers,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function TreeNode({ node, level = 0 }) {
  const [isOpen, setIsOpen] = useState(false);

  const sortedChildren = useMemo(() => {
    if (!node.children) return [];

    const folders = node.children
      .filter((child) => child.type === "folder")
      .sort((a, b) => a.name.localeCompare(b.name));

    const files = node.children
      .filter((child) => child.type === "file")
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...folders, ...files];
  }, [node.children]);

  if (node.type === "file") {
    return (
      <div
        className="flex items-center gap-2 px-2 py-1 text-xs text-white/80 hover:bg-white/10 rounded cursor-pointer transition-all duration-200"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <div className="w-5 h-5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-md flex items-center justify-center border border-emerald-500/30">
          <File className="h-3 w-3 text-emerald-400 flex-shrink-0" />
        </div>
        <span className="truncate">{node.name}</span>
      </div>
    );
  }

  const hasChildren = sortedChildren.length > 0;

  return (
    <div>
      <div
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 text-xs text-white/80 hover:bg-white/10 rounded cursor-pointer transition-all duration-200"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          isOpen ? (
            <ChevronDown className="h-3 w-3 text-white/50 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-white/50 flex-shrink-0" />
          )
        ) : (
          <div className="w-3" />
        )}
        <div className="w-5 h-5 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm rounded-md flex items-center justify-center border border-blue-500/30">
          {isOpen ? (
            <FolderOpen className="h-3 w-3 text-blue-400 flex-shrink-0" />
          ) : (
            <Folder className="h-3 w-3 text-blue-400 flex-shrink-0" />
          )}
        </div>
        <span className="truncate">{node.name}</span>
      </div>

      {isOpen && hasChildren && (
        <div>
          {sortedChildren.map((child, idx) => (
            <TreeNode
              key={`${child.name}-${idx}`}
              node={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CombinedSidebar({
  structure = { children: [] },
  isOpen = true,
  onClose = () => {},
  projectStats = {
    projectName: "My Project",
    totalFiles: 42,
    totalFolders: 12,
    hasAppRouter: true,
    routeCount: 8,
    apiEndpoints: 5,
    dynamicRoutes: 3,
    routeGroups: 2,
  },
  projectPath = "/home/user/projects/my-app",
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const filteredChildren = structure.children
    ? structure.children.filter(
        (child) => !(child.type === "folder" && child.name === "app")
      )
    : [];

  const sortedRootChildren = useMemo(() => {
    const folders = filteredChildren
      .filter((child) => child.type === "folder")
      .sort((a, b) => a.name.localeCompare(b.name));

    const files = filteredChildren
      .filter((child) => child.type === "file")
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...folders, ...files];
  }, [filteredChildren]);

  const filteredStructure = {
    ...structure,
    children: sortedRootChildren,
  };

  const toggleTab = (tab) => {
    setActiveTab(activeTab === tab ? "" : tab);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed left-4 top-4 bottom-4 z-50 pointer-events-none transition-all duration-300 ${
        isCollapsed ? "w-14" : "w-72"
      }`}
    >
      <div className="h-full rounded-2xl border border-white/20 backdrop-blur-xl bg-black/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] flex flex-col pointer-events-auto relative overflow-hidden">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3 py-4 relative z-10 h-full">
            <button
              onClick={() => setIsCollapsed(false)}
              className="text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-lg p-2 transition-all duration-200"
              title="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center gap-3 flex-1">
              <button
                onClick={() => {
                  setIsCollapsed(false);
                  setActiveTab("info");
                }}
                className={`group hover:bg-white/10 backdrop-blur-sm rounded-lg p-2 transition-all duration-200 ${
                  activeTab === "info"
                    ? "bg-white/20 shadow-lg border border-white/30"
                    : ""
                }`}
                title="Project Info"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm rounded-lg flex items-center justify-center border border-purple-500/40 group-hover:border-purple-400/60 transition-all duration-200">
                  <FileText className="w-4 h-4 text-purple-300 group-hover:text-purple-200" />
                </div>
              </button>

              <button
                onClick={() => {
                  setIsCollapsed(false);
                  setActiveTab("files");
                }}
                className={`group hover:bg-white/10 backdrop-blur-sm rounded-lg p-2 transition-all duration-200 ${
                  activeTab === "files"
                    ? "bg-white/20 shadow-lg border border-white/30"
                    : ""
                }`}
                title="Directory"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 backdrop-blur-sm rounded-lg flex items-center justify-center border border-blue-500/40 group-hover:border-blue-400/60 transition-all duration-200">
                  <Folder className="w-4 h-4 text-blue-300 group-hover:text-blue-200" />
                </div>
              </button>
            </div>

            <Button
              onClick={() => (window.location.href = "/")}
              size="sm"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm shadow-lg text-white p-2 h-auto border border-white/20 group"
              title="Go to Home"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-amber-500/30 to-orange-500/30 backdrop-blur-sm rounded-lg flex items-center justify-center border border-amber-500/40 group-hover:border-amber-400/60 transition-all duration-200">
                <Home className="w-4 h-4 text-amber-300 group-hover:text-amber-200" />
              </div>
            </Button>
          </div>
        ) : (
          <>
            {/* Expanded State - Header Section */}
            <div className="px-3 py-3 border-b border-white/10 relative z-10 bg-black/30 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0 border border-cyan-500/40 backdrop-blur-sm">
                    <Code className="w-3.5 h-3.5 text-cyan-300" />
                  </div>
                  <h1 className="text-sm font-bold text-white truncate">
                    Code Visualizer
                  </h1>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-lg p-1 transition-all duration-200"
                    title="Collapse sidebar"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Accordion Content area */}
            <div className="flex-1 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {/* Project Info Accordion */}
              <div className="border-b border-white/10">
                <button
                  onClick={() => toggleTab("info")}
                  className={`w-full px-3 py-2.5 flex items-center justify-between text-xs font-medium hover:bg-white/5 backdrop-blur-sm transition-all duration-200 ${
                    activeTab === "info"
                      ? "bg-white/15 text-white border-l-4 border-white shadow-sm"
                      : "text-white/70"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm rounded-md flex items-center justify-center border border-purple-500/40">
                      <FileText className="w-3.5 h-3.5 text-purple-300" />
                    </div>
                    <span>Project Info</span>
                  </div>
                  {activeTab === "info" ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>

                {activeTab === "info" && (
                  <div className="px-3 py-3 space-y-3 bg-black/40 backdrop-blur-md border-t border-white/5">
                    {/* Project Name */}
                    <div>
                      <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                        Project Name
                      </h3>
                      <p className="text-sm text-white font-medium">
                        {projectStats.projectName}
                      </p>
                    </div>

                    {/* Project Path */}
                    <div>
                      <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                        Path
                      </h3>
                      <p
                        className="text-xs text-gray-400 break-all"
                        title={projectPath}
                      >
                        {projectPath}
                      </p>
                    </div>

                    {/* Statistics */}
                    <div>
                      <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                        Statistics
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-2 py-1.5 backdrop-blur-sm border border-white/10">
                          <span className="text-gray-400 flex items-center gap-1.5">
                            <div className="w-5 h-5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-md flex items-center justify-center border border-emerald-500/30">
                              <FileText className="w-2.5 h-2.5 text-emerald-400" />
                            </div>
                            Total Files
                          </span>
                          <span className="text-white font-medium">
                            {projectStats.totalFiles}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-2 py-1.5 backdrop-blur-sm border border-white/10">
                          <span className="text-gray-400 flex items-center gap-1.5">
                            <div className="w-5 h-5 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm rounded-md flex items-center justify-center border border-blue-500/30">
                              <Folder className="w-2.5 h-2.5 text-blue-400" />
                            </div>
                            Total Folders
                          </span>
                          <span className="text-white font-medium">
                            {projectStats.totalFolders}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                        Features
                      </h3>
                      <div className="space-y-2">
                        {projectStats.hasAppRouter && (
                          <div className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-2 py-1.5 backdrop-blur-sm border border-white/10">
                            <span className="text-gray-400 flex items-center gap-1.5">
                              <div className="w-5 h-5 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-sm rounded-md flex items-center justify-center border border-yellow-500/30">
                                <Zap className="w-2.5 h-2.5 text-yellow-400" />
                              </div>
                              App Router
                            </span>
                            <Badge className="bg-green-500/20 text-green-400 text-[9px] border-green-500/30 px-1.5 py-0 h-4 backdrop-blur-sm">
                              Active
                            </Badge>
                          </div>
                        )}
                        {projectStats.routeCount > 0 && (
                          <div className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-2 py-1.5 backdrop-blur-sm border border-white/10">
                            <span className="text-gray-400 flex items-center gap-1.5">
                              <div className="w-5 h-5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm rounded-md flex items-center justify-center border border-cyan-500/30">
                                <Globe className="w-2.5 h-2.5 text-cyan-400" />
                              </div>
                              Routes
                            </span>
                            <span className="text-white font-medium">
                              {projectStats.routeCount}
                            </span>
                          </div>
                        )}
                        {projectStats.apiEndpoints > 0 && (
                          <div className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-2 py-1.5 backdrop-blur-sm border border-white/10">
                            <span className="text-gray-400 flex items-center gap-1.5">
                              <div className="w-5 h-5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-md flex items-center justify-center border border-purple-500/30">
                                <Code className="w-2.5 h-2.5 text-purple-400" />
                              </div>
                              API Endpoints
                            </span>
                            <span className="text-white font-medium">
                              {projectStats.apiEndpoints}
                            </span>
                          </div>
                        )}
                        {projectStats.dynamicRoutes > 0 && (
                          <div className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-2 py-1.5 backdrop-blur-sm border border-white/10">
                            <span className="text-gray-400 flex items-center gap-1.5">
                              <div className="w-5 h-5 bg-gradient-to-br from-rose-500/20 to-pink-500/20 backdrop-blur-sm rounded-md flex items-center justify-center border border-rose-500/30">
                                <Route className="w-2.5 h-2.5 text-rose-400" />
                              </div>
                              Dynamic Routes
                            </span>
                            <span className="text-white font-medium">
                              {projectStats.dynamicRoutes}
                            </span>
                          </div>
                        )}
                        {projectStats.routeGroups > 0 && (
                          <div className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-2 py-1.5 backdrop-blur-sm border border-white/10">
                            <span className="text-gray-400 flex items-center gap-1.5">
                              <div className="w-5 h-5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-md flex items-center justify-center border border-indigo-500/30">
                                <Layers className="w-2.5 h-2.5 text-indigo-400" />
                              </div>
                              Route Groups
                            </span>
                            <span className="text-white font-medium">
                              {projectStats.routeGroups}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Directory Accordion */}
              <div className="border-b border-white/10">
                <button
                  onClick={() => toggleTab("files")}
                  className={`w-full px-3 py-2.5 flex items-center justify-between text-xs font-medium hover:bg-white/5 backdrop-blur-sm transition-all duration-200 ${
                    activeTab === "files"
                      ? "bg-white/15 text-white border-l-4 border-white shadow-sm"
                      : "text-white/70"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 backdrop-blur-sm rounded-md flex items-center justify-center border border-blue-500/40">
                      <Folder className="w-3.5 h-3.5 text-blue-300" />
                    </div>
                    <span>Directory</span>
                  </div>
                  {activeTab === "files" ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>

                {activeTab === "files" && (
                  <div className="px-1.5 py-1.5 bg-black/40 backdrop-blur-md border-t border-white/5">
                    {filteredStructure.children.map((node, idx) => (
                      <TreeNode key={`${node.name}-${idx}`} node={node} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Home Button - Fixed at bottom */}
            <div className="p-3 border-t border-white/10 relative z-10 bg-black/30 backdrop-blur-sm">
              <Button
                onClick={() => (window.location.href = "/")}
                size="sm"
                className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm shadow-lg h-8 text-xs border border-white/20 text-white group"
              >
                <div className="w-5 h-5 bg-gradient-to-br from-amber-500/30 to-orange-500/30 backdrop-blur-sm rounded-md flex items-center justify-center border border-amber-500/40 mr-1.5 group-hover:border-amber-400/60 transition-all duration-200">
                  <Home className="w-3 h-3 text-amber-300 group-hover:text-amber-200" />
                </div>
                Home
              </Button>
            </div>

            {/* Subtle bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-20" />
          </>
        )}
      </div>
    </div>
  );
}
