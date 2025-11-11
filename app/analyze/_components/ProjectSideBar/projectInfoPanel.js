"use client";

import { Panel } from "@xyflow/react";
import {
  Folder,
  File,
  Globe,
  Code,
  Route,
  Layers,
  Zap,
  Database,
  Key,
  Link2,
  Tag,
  GitBranch,
  Shield,
} from "lucide-react";

export default function ProjectInfoPanel({
  projectStats,
  currentView,
  schemaStats,
  schemaFileName,
}) {
  // Render project stats for dependency view
  if (currentView === "dependency") {
    return (
      <Panel position="bottom-left" className="!m-0 !bottom-4 !left-4">
        <div className="rounded-xl border border-white/10 backdrop-blur-xl bg-black/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_48px_0_rgba(0,0,0,0.8)] hover:bg-black/70 group">
          {/* Horizontal Layout */}
          <div className="px-4 py-2.5 flex items-center gap-4">
            {/* Project Info */}
            <div className="flex items-center gap-2 pr-4 border-r border-white/10">
              <div className="w-6 h-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all duration-300">
                <Code className="w-3.5 h-3.5 text-cyan-300" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white whitespace-nowrap">
                  {projectStats.projectName}
                </p>
                {projectStats.hasAppRouter && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Zap className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-medium">
                      App Router
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats - Horizontal Row */}
            <div className="flex items-center gap-3">
              {/* Files */}
              <div className="flex items-center gap-1.5 group/stat cursor-default">
                <div className="w-5 h-5 bg-green-500/10 rounded flex items-center justify-center transition-all group-hover/stat:bg-green-500/20">
                  <File className="w-3 h-3 text-green-400" />
                </div>
                <span className="text-xs font-semibold text-white">
                  {projectStats.totalFiles}
                </span>
                <span className="text-[11px] text-gray-400 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200 max-w-0 group-hover/stat:max-w-xs overflow-hidden whitespace-nowrap">
                  Files
                </span>
              </div>

              <div className="w-px h-4 bg-white/10" />

              {/* Folders */}
              <div className="flex items-center gap-1.5 group/stat cursor-default">
                <div className="w-5 h-5 bg-blue-500/10 rounded flex items-center justify-center transition-all group-hover/stat:bg-blue-500/20">
                  <Folder className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-white">
                  {projectStats.totalFolders}
                </span>
                <span className="text-[11px] text-gray-400 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200 max-w-0 group-hover/stat:max-w-xs overflow-hidden whitespace-nowrap">
                  Folders
                </span>
              </div>

              {/* Route Stats */}
              {projectStats.hasAppRouter && (
                <>
                  {/* Total Routes */}
                  {projectStats.routeCount > 0 && (
                    <>
                      <div className="w-px h-4 bg-white/10" />
                      <div className="flex items-center gap-1.5 group/stat cursor-default">
                        <div className="w-5 h-5 bg-cyan-500/10 rounded flex items-center justify-center transition-all group-hover/stat:bg-cyan-500/20">
                          <Globe className="w-3 h-3 text-cyan-400" />
                        </div>
                        <span className="text-xs font-semibold text-white">
                          {projectStats.routeCount}
                        </span>
                        <span className="text-[11px] text-gray-400 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200 max-w-0 group-hover/stat:max-w-xs overflow-hidden whitespace-nowrap">
                          Routes
                        </span>
                      </div>
                    </>
                  )}

                  {/* API Routes */}
                  {projectStats.apiEndpoints > 0 && (
                    <>
                      <div className="w-px h-4 bg-white/10" />
                      <div className="flex items-center gap-1.5 group/stat cursor-default">
                        <div className="w-5 h-5 bg-purple-500/10 rounded flex items-center justify-center transition-all group-hover/stat:bg-purple-500/20">
                          <Code className="w-3 h-3 text-purple-400" />
                        </div>
                        <span className="text-xs font-semibold text-white">
                          {projectStats.apiEndpoints}
                        </span>
                        <span className="text-[11px] text-gray-400 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200 max-w-0 group-hover/stat:max-w-xs overflow-hidden whitespace-nowrap">
                          API
                        </span>
                      </div>
                    </>
                  )}

                  {/* Dynamic Routes */}
                  {projectStats.dynamicRoutes > 0 && (
                    <>
                      <div className="w-px h-4 bg-white/10" />
                      <div className="flex items-center gap-1.5 group/stat cursor-default">
                        <div className="w-5 h-5 bg-rose-500/10 rounded flex items-center justify-center transition-all group-hover/stat:bg-rose-500/20">
                          <Route className="w-3 h-3 text-rose-400" />
                        </div>
                        <span className="text-xs font-semibold text-white">
                          {projectStats.dynamicRoutes}
                        </span>
                        <span className="text-[11px] text-gray-400 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200 max-w-0 group-hover/stat:max-w-xs overflow-hidden whitespace-nowrap">
                          Dynamic
                        </span>
                      </div>
                    </>
                  )}

                  {/* Route Groups */}
                  {projectStats.routeGroups > 0 && (
                    <>
                      <div className="w-px h-4 bg-white/10" />
                      <div className="flex items-center gap-1.5 group/stat cursor-default">
                        <div className="w-5 h-5 bg-indigo-500/10 rounded flex items-center justify-center transition-all group-hover/stat:bg-indigo-500/20">
                          <Layers className="w-3 h-3 text-indigo-400" />
                        </div>
                        <span className="text-xs font-semibold text-white">
                          {projectStats.routeGroups}
                        </span>
                        <span className="text-[11px] text-gray-400 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200 max-w-0 group-hover/stat:max-w-xs overflow-hidden whitespace-nowrap">
                          Groups
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Panel>
    );
  }

  // Render schema stats for schema view
  if (currentView === "schema" && schemaStats) {
    const { overview, relations, indexes, enums } = schemaStats;

    return (
      <Panel position="bottom-left" className="!m-0 !bottom-4 !left-4">
        <div className="rounded-xl border border-white/10 backdrop-blur-xl bg-black/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_48px_0_rgba(0,0,0,0.8)] hover:bg-black/70 group">
          {/* Horizontal Layout */}
          <div className="px-4 py-2.5 flex items-center gap-4">
            {/* Schema Info */}
            <div className="flex items-center gap-2 pr-4 border-r border-white/10">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-blue-500/30 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-300">
                <Database className="w-3.5 h-3.5 text-blue-300" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white whitespace-nowrap">
                  {schemaFileName || "Schema"}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Shield className="w-2.5 h-2.5 text-blue-400" />
                  <span className="text-[10px] text-blue-400 font-medium">
                    Prisma Schema
                  </span>
                </div>
              </div>
            </div>

            {/* Stats - Horizontal Row */}
            <div className="flex items-center gap-3">
              {/* Models */}
              <div className="flex items-center gap-1.5 group/stat cursor-default">
                <div className="w-5 h-5 bg-blue-500/10 rounded flex items-center justify-center transition-all group-hover/stat:bg-blue-500/20">
                  <Database className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-white">
                  {overview.modelCount}
                </span>
                <span className="text-[11px] text-gray-400 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200 max-w-0 group-hover/stat:max-w-xs overflow-hidden whitespace-nowrap">
                  Models
                </span>
              </div>

              <div className="w-px h-4 bg-white/10" />

              {/* Relations */}
              <div className="flex items-center gap-1.5 group/stat cursor-default">
                <div className="w-5 h-5 bg-cyan-500/10 rounded flex items-center justify-center transition-all group-hover/stat:bg-cyan-500/20">
                  <Link2 className="w-3 h-3 text-cyan-400" />
                </div>
                <span className="text-xs font-semibold text-white">
                  {relations.total}
                </span>
                <span className="text-[11px] text-gray-400 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200 max-w-0 group-hover/stat:max-w-xs overflow-hidden whitespace-nowrap">
                  Relations
                </span>
              </div>

              {/* Relation Type Breakdown */}
              {relations.oneToMany > 0 && (
                <>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex items-center gap-1.5 group/stat cursor-default">
                    <div className="w-5 h-5 bg-emerald-500/10 rounded flex items-center justify-center transition-all group-hover/stat:bg-emerald-500/20">
                      <GitBranch className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-xs font-semibold text-white">
                      {relations.oneToMany}
                    </span>
                    <span className="text-[11px] text-gray-400 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200 max-w-0 group-hover/stat:max-w-xs overflow-hidden whitespace-nowrap">
                      1:N
                    </span>
                  </div>
                </>
              )}

              {relations.manyToMany > 0 && (
                <>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex items-center gap-1.5 group/stat cursor-default">
                    <div className="w-5 h-5 bg-orange-500/10 rounded flex items-center justify-center transition-all group-hover/stat:bg-orange-500/20">
                      <Layers className="w-3 h-3 text-orange-400" />
                    </div>
                    <span className="text-xs font-semibold text-white">
                      {relations.manyToMany}
                    </span>
                    <span className="text-[11px] text-gray-400 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200 max-w-0 group-hover/stat:max-w-xs overflow-hidden whitespace-nowrap">
                      N:N
                    </span>
                  </div>
                </>
              )}

              <div className="w-px h-4 bg-white/10" />

              {/* Indexes */}
              <div className="flex items-center gap-1.5 group/stat cursor-default">
                <div className="w-5 h-5 bg-yellow-500/10 rounded flex items-center justify-center transition-all group-hover/stat:bg-yellow-500/20">
                  <Key className="w-3 h-3 text-yellow-400" />
                </div>
                <span className="text-xs font-semibold text-white">
                  {indexes.total}
                </span>
                <span className="text-[11px] text-gray-400 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200 max-w-0 group-hover/stat:max-w-xs overflow-hidden whitespace-nowrap">
                  Indexes
                </span>
              </div>

              {/* Enums */}
              {enums.total > 0 && (
                <>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex items-center gap-1.5 group/stat cursor-default">
                    <div className="w-5 h-5 bg-purple-500/10 rounded flex items-center justify-center transition-all group-hover/stat:bg-purple-500/20">
                      <Tag className="w-3 h-3 text-purple-400" />
                    </div>
                    <span className="text-xs font-semibold text-white">
                      {enums.total}
                    </span>
                    <span className="text-[11px] text-gray-400 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-200 max-w-0 group-hover/stat:max-w-xs overflow-hidden whitespace-nowrap">
                      Enums
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Panel>
    );
  }

  // Fallback - no stats available
  return null;
}
