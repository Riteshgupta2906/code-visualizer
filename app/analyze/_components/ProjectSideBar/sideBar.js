"use client";

import { useState, useMemo } from "react";
import {
  X,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

function TreeNode({ node, level = 0 }) {
  const [isOpen, setIsOpen] = useState(false);

  // Sort children: folders first (alphabetically), then files (alphabetically)
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
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10 rounded cursor-pointer transition-colors"
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <File className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        <span className="truncate">{node.name}</span>
      </div>
    );
  }

  const hasChildren = sortedChildren.length > 0;

  return (
    <div>
      <div
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10 rounded cursor-pointer transition-colors"
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {hasChildren &&
          (isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
          ))}
        {!hasChildren && <div className="w-3.5" />}
        {isOpen ? (
          <FolderOpen className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
        ) : (
          <Folder className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
        )}
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

export function CustomSidebar({ structure, isOpen, onClose }) {
  const filteredChildren = structure.children
    ? structure.children.filter(
        (child) => !(child.type === "folder" && child.name === "app")
      )
    : [];

  // Sort root level: folders first, then files
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - more transparent */}
      <div className="fixed inset-0 bg-black/5 z-40 transition-opacity pointer-events-none" />

      {/* Sidebar - increased transparency */}
      <div className="fixed left-4 top-24 bottom-4 w-64 z-50 pointer-events-none">
        <div className="h-full rounded-xl border border-gray-700/30 bg-gray-900/50 backdrop-blur-2xl shadow-2xl flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/20">
            <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Project Files
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 px-2 py-2">
            {filteredStructure.children.map((node, idx) => (
              <TreeNode key={`${node.name}-${idx}`} node={node} />
            ))}
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
