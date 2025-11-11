import { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  Home,
  Maximize,
  Minus,
  Plus,
  Maximize2,
  Minimize2,
  Menu,
  GitBranch,
  Database,
  Network,
  Info,
} from "lucide-react";
import { Panel, useViewport, useStore, useReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

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
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 rounded cursor-pointer transition-all duration-200"
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <div className="w-4 h-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded flex items-center justify-center border border-emerald-500/30">
          <File className="h-2.5 w-2.5 text-emerald-400 flex-shrink-0" />
        </div>
        <span className="truncate text-xs">{node.name}</span>
      </div>
    );
  }

  const hasChildren = sortedChildren.length > 0;

  return (
    <div>
      <div
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 rounded cursor-pointer transition-all duration-200"
        style={{ paddingLeft: `${level * 16 + 12}px` }}
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
        <div className="w-4 h-4 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm rounded flex items-center justify-center border border-blue-500/30">
          {isOpen ? (
            <FolderOpen className="h-2.5 w-2.5 text-blue-400 flex-shrink-0" />
          ) : (
            <Folder className="h-2.5 w-2.5 text-blue-400 flex-shrink-0" />
          )}
        </div>
        <span className="truncate text-xs">{node.name}</span>
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

export default function FloatingTopBar({
  structure = { children: [] },
  projectPath = "/home/user/projects/my-app",
  allExpanded = false,
  onExpandAll = () => {},
  onCollapseAll = () => {},
  currentView = "dependency",
  onViewChange = () => {},
  selectedSchema = null,
  onSchemaSelect = () => {},
  prismaInfo = null,
}) {
  console.log("structure prop:", structure);
  const [showBreadcrumbMenu, setShowBreadcrumbMenu] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showSchemaDropdown, setShowSchemaDropdown] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const breadcrumbRef = useRef(null);
  const layoutRef = useRef(null);
  const schemaRef = useRef(null);
  const infoRef = useRef(null);

  // ReactFlow hooks
  const { zoom } = useViewport();
  const { zoomTo, zoomIn, zoomOut, fitView } = useReactFlow();
  const minZoom = useStore((state) => state.minZoom);
  const maxZoom = useStore((state) => state.maxZoom);

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
  //  console.log("Filtered Structure:", structure);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        breadcrumbRef.current &&
        !breadcrumbRef.current.contains(event.target)
      ) {
        setShowBreadcrumbMenu(false);
        setShowDirectory(false);
      }
      if (layoutRef.current && !layoutRef.current.contains(event.target)) {
        setShowLayoutMenu(false);
      }
      if (schemaRef.current && !schemaRef.current.contains(event.target)) {
        setShowSchemaDropdown(false);
      }
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowInfo(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const viewOptions = [
    {
      id: "dependency",
      label: "Dependency",
      icon: GitBranch,
      description: "View dependencies between files",
      enabled: true,
    },
    {
      id: "schema",
      label: "Schema",
      icon: Database,
      description: "View data schema structure",
      enabled: prismaInfo?.detected || false,
      badge: prismaInfo?.schemas?.length || 0,
    },
    {
      id: "api",
      label: "API View",
      icon: Network,
      description: "View API endpoints and routes",
      enabled: false,
    },
  ];

  const currentViewOption = viewOptions.find((v) => v.id === currentView);

  // Get selected schema info
  const selectedSchemaInfo = useMemo(() => {
    if (!selectedSchema || !prismaInfo?.schemas) return null;
    return prismaInfo.schemas.find((s) => s.filePath === selectedSchema);
  }, [selectedSchema, prismaInfo]);

  // Determine if schema dropdown should be shown
  const showSchemaSelector =
    currentView === "schema" &&
    prismaInfo?.detected &&
    prismaInfo.schemas.length > 0;

  return (
    <>
      {/* Separate Breadcrumb - Top Left Corner */}
      <Panel position="top-left" className="!m-0 !top-3 !left-3">
        <div className="relative" ref={breadcrumbRef}>
          <button
            onClick={() => setShowBreadcrumbMenu(!showBreadcrumbMenu)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-xl bg-black/40 rounded-xl transition-all duration-200 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]"
          >
            <Menu className="w-3.5 h-3.5" />
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                showBreadcrumbMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Breadcrumb Dropdown Menu */}
          {showBreadcrumbMenu && (
            <div className="absolute top-full left-0 mt-2 w-60 rounded-xl border border-white/20 backdrop-blur-xl bg-black/90 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] z-50">
              <div className="p-2">
                {/* Directory Structure Button */}
                <button
                  onClick={() => setShowDirectory(!showDirectory)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Directory Structure</span>
                  <ChevronRight
                    className={`w-3 h-3 ml-auto transition-transform duration-200 ${
                      showDirectory ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {/* Directory Tree */}
                {showDirectory && (
                  <div className="mt-2 ml-2 max-h-96 overflow-y-auto rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="p-2">
                      {filteredStructure.children &&
                      filteredStructure.children.length > 0 ? (
                        filteredStructure.children.map((child, idx) => (
                          <TreeNode
                            key={`${child.name}-${idx}`}
                            node={child}
                            level={0}
                          />
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 px-3 py-2">
                          No items to display
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="h-px bg-white/10 my-2" />

                {/* Home Button */}
                <button
                  onClick={() => (window.location.href = "/")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Panel>

      {/* Info Button - Top Right Corner */}
      <Panel position="top-right" className="!m-0 !top-3 !right-3">
        <div className="relative" ref={infoRef}>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-xl bg-black/40 rounded-xl transition-all duration-200 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]"
          >
            <Info className="w-3.5 h-3.5" />
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                showInfo ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Info Dropdown Panel */}
          {showInfo && (
            <div className="absolute top-full right-0 mt-2 w-80 rounded-xl border border-white/20 backdrop-blur-xl bg-black/90 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] z-50">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Page Information
                  </h3>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/10 mb-3" />

                {/* Content Area - Empty for now */}
                <div className="text-xs text-white/60 text-center py-6">
                  Information will be displayed here
                </div>
              </div>
            </div>
          )}
        </div>
      </Panel>

      {/* Main Top Bar - Top Center */}
      <Panel position="top-center" className="!m-0 !top-3">
        <div className="rounded-xl border border-white/20 backdrop-blur-xl bg-black/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] min-w-[700px]">
          <div className="px-4 py-2 flex items-center justify-between gap-3">
            {/* Left: Layout Dropdown + Schema Dropdown (conditionally) */}
            <div className="flex items-center gap-2">
              {/* Layout Dropdown */}
              <div className="relative" ref={layoutRef}>
                <button
                  onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-200 border border-white/10"
                >
                  {currentViewOption && (
                    <currentViewOption.icon className="w-3.5 h-3.5" />
                  )}
                  <span>Layout</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${
                      showLayoutMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Layout Dropdown Menu */}
                {showLayoutMenu && (
                  <div className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-white/20 backdrop-blur-xl bg-black/90 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] z-50">
                    <div className="p-2">
                      {viewOptions.map((option) => {
                        const Icon = option.icon;
                        const isActive = currentView === option.id;
                        const isDisabled = !option.enabled;
                        return (
                          <button
                            key={option.id}
                            onClick={() => {
                              if (!isDisabled) {
                                onViewChange(option.id);
                                setShowLayoutMenu(false);
                              }
                            }}
                            disabled={isDisabled}
                            className={`w-full flex items-start gap-3 px-3 py-2.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                              isDisabled
                                ? "opacity-50 cursor-not-allowed"
                                : isActive
                                ? "bg-white/15 text-white"
                                : "text-white/80 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                isActive ? "text-cyan-400" : ""
                              }`}
                            />
                            <div className="flex-1 text-left">
                              <div className="font-semibold flex items-center gap-2">
                                {option.label}
                                {option.badge > 0 && (
                                  <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 rounded">
                                    {option.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                {option.description}
                              </div>
                            </div>
                            {isActive && (
                              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Schema Dropdown - Only visible in schema view */}
              {showSchemaSelector && (
                <div className="relative" ref={schemaRef}>
                  <button
                    onClick={() => setShowSchemaDropdown(!showSchemaDropdown)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-200 border border-white/10"
                  >
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="max-w-[150px] truncate">
                      {selectedSchemaInfo?.fileName || "Select schema..."}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        showSchemaDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Schema Dropdown Menu */}
                  {showSchemaDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-80 rounded-xl border border-white/20 backdrop-blur-xl bg-black/90 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] z-50 max-h-96 overflow-y-auto">
                      <div className="p-2">
                        {prismaInfo.schemas.map((schema) => {
                          const isSelected = selectedSchema === schema.filePath;
                          return (
                            <button
                              key={schema.filePath}
                              onClick={() => {
                                onSchemaSelect(schema.filePath);
                                setShowSchemaDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                isSelected
                                  ? "bg-cyan-500/20 text-white"
                                  : "text-white/80 hover:text-white hover:bg-white/10"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm">
                                  {schema.fileName}
                                </span>
                                {isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                                )}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {schema.stats.models} models •{" "}
                                {schema.stats.enums} enums •{" "}
                                {schema.stats.relationships.total} relations
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Zoom Controls + View-specific controls */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => zoomOut({ duration: 300 })}
                className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-200"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>

              <Slider
                className="w-20"
                value={[zoom]}
                min={minZoom}
                max={maxZoom}
                step={0.01}
                onValueChange={(values) => zoomTo(values[0])}
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => zoomIn({ duration: 300 })}
                className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-200"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>

              <Button
                className="min-w-12 h-7 tabular-nums text-xs text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all duration-200"
                variant="ghost"
                onClick={() => zoomTo(1, { duration: 300 })}
              >
                {(100 * zoom).toFixed(0)}%
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => fitView({ duration: 300 })}
                className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-200"
              >
                <Maximize className="h-3.5 w-3.5" />
              </Button>

              {/* Divider */}
              <div className="w-px h-6 bg-white/20 mx-1" />

              {/* Expand/Collapse All Button - Only for dependency view */}
              {currentView === "dependency" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={allExpanded ? onCollapseAll : onExpandAll}
                  className="h-7 px-2.5 text-xs text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-200"
                >
                  {allExpanded ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 mr-1.5" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
                      Expand
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Panel>
    </>
  );
}
