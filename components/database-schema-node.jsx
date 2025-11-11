import React from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";

/**
 * Refined Connection Handle
 * Clean glassmorphism with subtle animations
 */
export const ConnectionHandle = ({
  type = "source",
  position = Position.Right,
  id,
  label,
  className,
}) => {
  const isSource = type === "source";

  return (
    <div
      className={cn(
        "relative inline-flex items-center",
        isSource ? "flex-row-reverse" : "flex-row",
        className
      )}
    >
      {/* The actual ReactFlow handle */}
      <Handle
        type={type}
        position={position}
        id={id}
        className={cn(
          // Size and shape
          "w-3 h-3 rounded-full",
          // Refined glass effect
          "bg-gradient-to-br from-white/40 to-white/10",
          // Subtle border
          "border border-white/20",
          // Soft inner highlight
          "shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.5)]",
          // Elegant outer glow
          "shadow-[0_0_8px_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.4)]",
          // Smooth hover effects
          "hover:scale-110 hover:bg-gradient-to-br hover:from-white/60 hover:to-white/20",
          "hover:shadow-[0_0_12px_rgba(255,255,255,0.5),0_2px_8px_rgba(0,0,0,0.5)]",
          "hover:border-white/40",
          // Smooth transitions
          "transition-all duration-200 ease-out"
          // ✅ REMOVED: "!static !transform-none" - this was breaking handle positioning
        )}
      />

      {/* Label text with minimal backdrop */}
      {label && (
        <span
          className={cn(
            "text-xs font-medium",
            "text-slate-400 group-hover:text-slate-200",
            "whitespace-nowrap",
            // Minimal glass backdrop
            "px-2 py-0.5 rounded",
            "bg-slate-900/60 backdrop-blur-sm",
            "border border-slate-700/30",
            "transition-all duration-200",
            isSource ? "mr-1.5 text-right" : "ml-1.5 text-left"
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
};

/**
 * Field with Handles (for relation and enum fields)
 * Clean design with subtle hover states
 */
export const FieldWithHandle = ({
  id,
  name,
  type,
  icon,
  variant = "relation",
  className,
}) => {
  const variantStyles = {
    relation: {
      text: "text-slate-300",
      border: "border-l-blue-400/40",
      bg: "bg-blue-500/5 hover:bg-blue-500/10",
    },
    enum: {
      text: "text-slate-300",
      border: "border-l-purple-400/40",
      bg: "bg-purple-500/5 hover:bg-purple-500/10",
    },
    primary: {
      text: "text-slate-200",
      border: "border-l-emerald-400/50",
      bg: "bg-emerald-500/5 hover:bg-emerald-500/10",
    },
  };

  const style = variantStyles[variant];

  return (
    <>
      {/* Left side - Target handle + Name */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <ConnectionHandle
          type="target"
          position={Position.Left}
          id={`${id}-target`}
          className="flex-shrink-0"
        />

        {icon && (
          <div className="flex-shrink-0 p-1.5 rounded bg-slate-800/50 border border-slate-700/50">
            {icon}
          </div>
        )}

        <span
          className={cn(
            "text-sm font-medium truncate",
            style.text,
            "group-hover:text-white",
            "transition-colors duration-200"
          )}
        >
          {name}
        </span>
      </div>

      {/* Right side - Type + Source handle */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <span
          className={cn(
            "text-xs font-mono px-2 py-0.5 rounded",
            "text-slate-400 group-hover:text-slate-300",
            // Clean type badge
            "bg-slate-800/50 backdrop-blur-sm",
            "border border-slate-700/30",
            "transition-colors duration-200"
          )}
        >
          {type}
        </span>

        <ConnectionHandle
          type="source"
          position={Position.Right}
          id={`${id}-source`}
          className="flex-shrink-0"
        />
      </div>
    </>
  );
};

/**
 * Enhanced Schema Node Container
 * Premium glassmorphism with clean edges
 */
export const SchemaNodeContainer = ({ className, children }) => {
  return (
    <div
      className={cn(
        // Base structure
        "relative w-[320px] rounded-xl overflow-hidden",
        // Refined glassmorphism
        "backdrop-blur-xl bg-slate-900/60",
        // Clean border with subtle glow
        "border border-slate-700/50",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]",
        // Elegant hover effects
        "hover:border-slate-600/60",
        "hover:shadow-[0_12px_48px_rgba(0,0,0,0.5),0_0_24px_rgba(255,255,255,0.08)]",
        "hover:bg-slate-900/70",
        // Smooth transitions
        " transition-all duration-300 ease-out",
        // Subtle scale on hover
        "hover:scale-[1.01]",
        className
      )}
    >
      {/* Subtle top highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {children}

      {/* Subtle bottom shadow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />
    </div>
  );
};

/**
 * Enhanced Node Header
 * Clean gradient with glass overlay
 */
export const SchemaNodeHeader = ({
  children,
  variant = "model",
  className,
}) => {
  const gradients = {
    model:
      "bg-gradient-to-br from-slate-800/80 via-slate-900/70 to-slate-950/80",
    enum: "bg-gradient-to-br from-slate-700/80 via-slate-800/70 to-slate-900/80",
  };

  return (
    <div
      className={cn(
        // Base styling
        "relative px-4 py-3.5",
        // Gradient background
        gradients[variant],
        // Glass effect
        "backdrop-blur-xl",
        // Clean border
        "border-b border-slate-700/40",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]",
        // Text styling
        "text-white font-semibold text-sm tracking-wide",
        className
      )}
    >
      {/* Soft shine effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

      <div className="relative flex items-center justify-center gap-2.5">
        {children}
      </div>
    </div>
  );
};

/**
 * Enhanced Icon Container
 */
export const SchemaNodeIcon = ({ children, className }) => {
  return (
    <div
      className={cn(
        "p-2 rounded-lg",
        "bg-white/10 backdrop-blur-sm",
        "border border-white/10",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]",
        "flex items-center justify-center",
        "transition-transform duration-200",
        "group-hover:scale-105",
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Enhanced Node Body
 * Clean scrollable area with refined styling
 */
export const SchemaNodeBody = ({ children, className }) => {
  return (
    <div
      className={cn(
        // Clean dark background
        "bg-slate-950/50 backdrop-blur-sm",
        // Scrollable with max height
        " overflow-y-auto overflow-x-hidden",
        // Custom scrollbar with minimal design
        "scrollbar-thin scrollbar-track-slate-900/30 scrollbar-thumb-slate-700/60",
        "hover:scrollbar-thumb-slate-600/80",
        // Subtle inner shadow
        "shadow-[inset_0_1px_4px_rgba(0,0,0,0.2)]",
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Enhanced Field Row
 * Clean and minimal with subtle hover states
 */
export const SchemaFieldRow = ({
  children,
  variant = "default",
  className,
}) => {
  const variants = {
    default: "hover:bg-slate-800/30",
    relation:
      "bg-blue-500/5 hover:bg-blue-500/10 border-l-2 border-l-blue-400/40 hover:border-l-blue-400/60",
    enum: "bg-purple-500/5 hover:bg-purple-500/10 border-l-2 border-l-purple-400/40 hover:border-l-purple-400/60",
    primary:
      "bg-emerald-500/5 hover:bg-emerald-500/10 border-l-2 border-l-emerald-400/50 hover:border-l-emerald-400/70",
  };

  return (
    <div
      className={cn(
        // Base layout
        "flex items-center justify-between",
        "px-4 py-2.5",
        // Border
        "border-b border-slate-800/50 last:border-b-0",
        // Variant styling
        variants[variant],
        // Smooth transitions
        "transition-all duration-200 group",
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Enhanced Field Name
 */
export const SchemaFieldName = ({ children, icon, className }) => {
  return (
    <div className={cn("flex items-center gap-2.5 flex-1 min-w-0", className)}>
      {icon && (
        <div className="flex-shrink-0 p-1.5 rounded bg-slate-800/50 border border-slate-700/50">
          {icon}
        </div>
      )}
      <span
        className={cn(
          "text-sm font-medium text-slate-300",
          "group-hover:text-white",
          "transition-colors duration-200 truncate"
        )}
      >
        {children}
      </span>
    </div>
  );
};

/**
 * Enhanced Field Type
 */
export const SchemaFieldType = ({ children, className }) => {
  return (
    <span
      className={cn(
        "text-xs font-mono px-2 py-0.5 rounded",
        "text-slate-400 group-hover:text-slate-300",
        // Clean badge effect
        "bg-slate-800/50 backdrop-blur-sm",
        "border border-slate-700/30",
        "transition-colors duration-200 text-right ml-2 flex-shrink-0",
        className
      )}
    >
      {children}
    </span>
  );
};

/**
 * Enhanced Node Footer
 * Clean footer with subtle glass effect
 */
export const SchemaNodeFooter = ({ children, className }) => {
  return (
    <div
      className={cn(
        // Glass background
        "bg-slate-950/60 backdrop-blur-sm",
        // Padding
        "px-4 py-3",
        // Clean border
        "border-t border-slate-700/40",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Enhanced Footer Stats Container
 */
export const SchemaNodeStats = ({ children, className }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 text-xs font-medium",
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Enhanced Individual Stat Item
 */
export const SchemaNodeStat = ({
  children,
  variant = "default",
  className,
}) => {
  const variants = {
    default: "text-slate-400 border-slate-700/40",
    primary: "text-slate-300 border-slate-600/50",
    accent: "text-slate-200 border-slate-500/60",
  };

  return (
    <span
      className={cn(
        "flex items-center gap-2",
        "px-2.5 py-1 rounded-md",
        "bg-slate-900/40 backdrop-blur-sm",
        "border",
        variants[variant],
        "transition-all duration-200",
        "hover:border-slate-600/60 hover:bg-slate-900/60",
        className
      )}
    >
      {children}
    </span>
  );
};

/**
 * Enhanced Animated Dot Indicator
 * Refined with cleaner colors
 */
export const StatusDot = ({ animated = false, color = "slate", className }) => {
  const colors = {
    slate: "bg-slate-400 shadow-[0_0_6px_rgba(148,163,184,0.4)]",
    blue: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]",
    purple: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]",
    emerald: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
    amber: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]",
  };

  return (
    <div
      className={cn(
        "w-2 h-2 rounded-full",
        "border border-white/20",
        colors[color],
        animated && "animate-pulse",
        "transition-all duration-200",
        className
      )}
    />
  );
};

/**
 * Divider for separating field groups
 */
export const SchemaFieldDivider = ({ label, className }) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2",
        "bg-slate-900/40 backdrop-blur-sm",
        "border-y border-slate-800/50",
        className
      )}
    >
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
      {label && (
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
    </div>
  );
};

/**
 * Badge for special field indicators (optional, unique, etc.)
 */
export const FieldBadge = ({ children, variant = "default", className }) => {
  const variants = {
    default: "bg-slate-700/40 text-slate-400 border-slate-600/40",
    primary: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider",
        "border backdrop-blur-sm",
        variants[variant],
        "transition-all duration-200",
        className
      )}
    >
      {children}
    </span>
  );
};
