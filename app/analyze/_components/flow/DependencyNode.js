import { Handle, Position } from "@xyflow/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  File,
  Package,
  ExternalLink,
  CheckCircle,
  XCircle,
  Import,
  Zap,
  Code,
  ArrowRight,
} from "lucide-react";

const DependencyNode = ({ data }) => {
  const { dependencyInfo, isLocal, exists, name } = data;

  const getNodeColor = () => {
    if (isLocal) {
      return exists
        ? "bg-gray-800/40 backdrop-blur-md border border-green-500/30 shadow-xl shadow-green-500/10"
        : "bg-gray-800/40 backdrop-blur-md border border-red-500/30 shadow-xl shadow-red-500/10";
    }
    return "bg-gray-800/40 backdrop-blur-md border border-blue-500/30 shadow-xl shadow-blue-500/10";
  };

  const getNodeIcon = () => {
    if (isLocal) {
      return exists ? (
        <File className="h-4 w-4 text-green-400" />
      ) : (
        <XCircle className="h-4 w-4 text-red-400" />
      );
    }
    return <Package className="h-4 w-4 text-blue-400" />;
  };

  const getImportTypeBadge = () => {
    const importType = dependencyInfo.type;
    const badgeProps = {
      import: {
        color: "bg-green-500/20 text-green-300 border-green-500/30",
        icon: Import,
      },
      "dynamic-import": {
        color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        icon: Zap,
      },
      require: {
        color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
        icon: Code,
      },
      "export-from": {
        color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        icon: ArrowRight,
      },
      "export-all-from": {
        color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        icon: ArrowRight,
      },
    };

    const config = badgeProps[importType] || badgeProps.import;
    const IconComponent = config.icon;

    return (
      <Badge
        className={`text-xs backdrop-blur-sm border font-semibold ${config.color}`}
      >
        <IconComponent className="w-3 h-3 mr-1" />
        {importType}
      </Badge>
    );
  };

  const getSpecifiersBadges = () => {
    if (!dependencyInfo.specifiers || dependencyInfo.specifiers.length === 0) {
      return null;
    }

    const visibleSpecifiers = dependencyInfo.specifiers.slice(0, 3);
    const hasMore = dependencyInfo.specifiers.length > 3;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {visibleSpecifiers.map((spec, index) => {
          let displayName = spec.local || spec.imported || spec.exported;
          if (spec.type === "ImportDefaultSpecifier") {
            displayName = `default as ${spec.local}`;
          } else if (spec.type === "ImportNamespaceSpecifier") {
            displayName = `* as ${spec.local}`;
          }

          return (
            <span
              key={spec.id || index}
              className="inline-block text-xs bg-gray-700/40 text-gray-300 px-1.5 py-0.5 rounded font-mono backdrop-blur-sm border border-gray-600/30"
            >
              {displayName}
            </span>
          );
        })}
        {hasMore && (
          <span className="inline-block text-xs bg-gray-700/30 text-gray-400 px-1.5 py-0.5 rounded backdrop-blur-sm border border-gray-600/20">
            +{dependencyInfo.specifiers.length - 3} more
          </span>
        )}
      </div>
    );
  };

  const getStatusIcon = () => {
    if (isLocal) {
      return exists ? (
        <CheckCircle className="w-3 h-3 text-green-400" />
      ) : (
        <XCircle className="w-3 h-3 text-red-400" />
      );
    }
    return <ExternalLink className="w-3 h-3 text-blue-400" />;
  };

  const truncateName = (name, maxLength = 25) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  return (
    <div className="relative">
      {/* Background gradient for dark glass effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gray-700/15 via-gray-800/10 to-gray-900/15 blur-lg transform rotate-1"></div>

      {/* Custom dependency input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="dependency-in"
        className="w-4 h-4 bg-purple-500/80 backdrop-blur-sm border-2 border-gray-800"
        style={{
          top: "-8px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />

      <Card
        className={`dependency-node min-w-[200px] max-w-[280px] ${getNodeColor()} border-2 relative z-10 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-gray-700/50 rounded-xl overflow-hidden`}
      >
        {/* Subtle animated background patterns */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-600/5 to-transparent rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-gray-700/5 to-transparent rounded-full blur-lg"></div>
        </div>

        <CardContent className="p-3 relative z-20">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-700/40 backdrop-blur-lg border border-gray-600/50 shadow-sm">
                {getNodeIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold text-sm truncate text-gray-100 drop-shadow-sm"
                  title={name}
                >
                  {truncateName(name)}
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  {getStatusIcon()}
                  <span className="text-xs text-gray-300">
                    {isLocal
                      ? exists
                        ? "Local file"
                        : "Missing file"
                      : "External package"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-2">{getImportTypeBadge()}</div>

          {!isLocal &&
            dependencyInfo.packageName &&
            dependencyInfo.packageName !== name && (
              <div className="mb-2">
                <div className="text-xs text-gray-300 font-mono bg-gray-800/30 backdrop-blur-lg px-2 py-1 rounded border border-gray-600/25">
                  Package: {dependencyInfo.packageName}
                </div>
              </div>
            )}

          {isLocal && dependencyInfo.relativePath && (
            <div className="mb-2">
              <div
                className="text-xs text-gray-300 font-mono bg-gray-800/30 backdrop-blur-lg px-2 py-1 rounded border border-gray-600/25 truncate"
                title={dependencyInfo.relativePath}
              >
                {truncateName(dependencyInfo.relativePath, 30)}
              </div>
            </div>
          )}

          {getSpecifiersBadges()}

          {/* {dependencyInfo.isAlias && (
            <div className="mt-2">
              <Badge
                variant="outline"
                className="text-xs bg-gray-700/30 backdrop-blur-lg border-gray-600/40 text-gray-200"
              >
                Path Alias
              </Badge>
            </div>
          )} */}
        </CardContent>
      </Card>
    </div>
  );
};

export default DependencyNode;
