import { X, Copy, Check, FileCode, Loader2 } from "lucide-react";
import { useState } from "react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import ts from "react-syntax-highlighter/dist/esm/languages/hljs/typescript";
import jsx from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

// Register languages
SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("typescript", ts);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("tsx", jsx);
SyntaxHighlighter.registerLanguage("css", css);

export default function FileCodeViewer({
  selectedNode,
  fileContent,
  loading,
  onClose,
}) {
  const [copied, setCopied] = useState(false);

  if (!selectedNode) return null;

  const handleCopy = async () => {
    if (fileContent) {
      await navigator.clipboard.writeText(fileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get file extension for syntax highlighting
  const getLanguage = (filePath) => {
    if (!filePath) return "javascript";
    const ext = filePath.split(".").pop().toLowerCase();
    const languageMap = {
      js: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "tsx",
      css: "css",
      scss: "css",
      json: "javascript",
    };
    return languageMap[ext] || "javascript";
  };

  // Get relative path from project root
  const getRelativePath = () => {
    if (!selectedNode.data.filePath || !selectedNode.data.projectRoot) {
      return selectedNode.data.name;
    }
    return selectedNode.data.filePath.replace(
      selectedNode.data.projectRoot,
      ""
    );
  };

  return (
    <div className="absolute right-3 top-16 bottom-3 w-[650px] rounded-xl border border-white/20 backdrop-blur-xl bg-black/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] flex flex-col z-10">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-emerald-500/30">
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white truncate">
                {selectedNode.data.name}
              </h3>
              {selectedNode.data.fileAnalysis && (
                <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] rounded flex-shrink-0">
                  {selectedNode.data.fileAnalysis.purpose}
                </span>
              )}
              {selectedNode.data.isAppRouter && (
                <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] rounded flex-shrink-0">
                  App Router
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/50 truncate mt-0.5">
              {getRelativePath()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {fileContent && (
            <button
              onClick={handleCopy}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              title="Copy code"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code Content - Maximized for better visibility */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
              <p className="text-white/60 text-xs">Loading file content...</p>
            </div>
          </div>
        ) : fileContent ? (
          <SyntaxHighlighter
            language={getLanguage(selectedNode.data.filePath)}
            style={atomOneDark}
            customStyle={{
              margin: 0,
              padding: "0.75rem",
              background: "transparent",
              fontSize: "0.75rem",
              lineHeight: "1.6",
              height: "100%",
            }}
            showLineNumbers
            wrapLines
            lineNumberStyle={{
              minWidth: "2.5em",
              paddingRight: "0.75em",
              color: "#6B7280",
              userSelect: "none",
              fontSize: "0.7rem",
            }}
            codeTagProps={{
              style: {
                fontFamily:
                  '"JetBrains Mono", "Fira Code", "Consolas", monospace',
              },
            }}
          >
            {fileContent}
          </SyntaxHighlighter>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileCode className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-white/60 text-sm">No content available</p>
              <p className="text-xs text-white/40 mt-1">
                Unable to load file content
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
