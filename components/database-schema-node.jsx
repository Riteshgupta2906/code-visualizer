import React from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";

/**
 * Refined Connection Handle
 * Matching FloatingTopBar's glassmorphic design
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
          // Glassmorphic effect matching FloatingTopBar
          "bg-gradient-to-br from-white/30 to-white/10",
          // Border matching FloatingTopBar
          "border border-white/20",
          // Soft inner highlight
          "shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.4)]",
          // Elegant outer glow
          "shadow-[0_0_8px_rgba(255,255,255,0.25),0_2px_6px_rgba(0,0,0,0.4)]",
          // Smooth hover effects
          "hover:scale-110 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/20",
          "hover:shadow-[0_0_12px_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.5)]",
          "hover:border-white/30",
          // Smooth transitions
          "transition-all duration-200 ease-out"
        )}
      />

      {/* Label text with minimal backdrop */}
      {label && (
        <span
          className={cn(
            "text-xs font-medium",
            "text-white/60 group-hover:text-white/80",
            "whitespace-nowrap",
            // Minimal glass backdrop matching FloatingTopBar
            "px-2 py-0.5 rounded-lg",
            "bg-black/40 backdrop-blur-sm",
            "border border-white/10",
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
 * Updated with FloatingTopBar color scheme
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
      text: "text-white/80",
      border: "border-l-cyan-400/40",
      bg: "bg-cyan-500/10 hover:bg-cyan-500/15",
    },
    enum: {
      text: "text-white/80",
      border: "border-l-purple-400/40",
      bg: "bg-purple-500/10 hover:bg-purple-500/15",
    },
    primary: {
      text: "text-white",
      border: "border-l-emerald-400/50",
      bg: "bg-emerald-500/10 hover:bg-emerald-500/15",
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
          <div className="flex-shrink-0 p-1.5 rounded bg-white/5 border border-white/10">
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
            "text-xs font-mono px-2 py-0.5 rounded-lg",
            "text-white/60 group-hover:text-white/80",
            // Clean type badge matching FloatingTopBar
            "bg-white/5 backdrop-blur-sm",
            "border border-white/10",
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
 * Matching FloatingTopBar's glassmorphic design with enhanced shadows
 */
export const SchemaNodeContainer = ({ className, children }) => {
  return (
    <div
      className={cn(
        // Base structure
        "relative w-[320px] rounded-xl overflow-hidden",
        // Glassmorphism matching FloatingTopBar
        "backdrop-blur-xl bg-black/50",
        // Border matching FloatingTopBar
        "border border-white/25",
        // Enhanced shadow for better visibility
        "shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_4px_16px_0_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)]",
        // Elegant hover effects
        "hover:border-white/30",
        "hover:shadow-[0_16px_48px_0_rgba(0,0,0,0.7),0_8px_24px_0_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.15)]",
        "hover:bg-black/60",
        // Smooth transitions
        "transition-all duration-300 ease-out",
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
 * Matching FloatingTopBar gradient style
 */
export const SchemaNodeHeader = ({
  children,
  variant = "model",
  className,
}) => {
  const gradients = {
    model: "bg-black/40",
    enum: "bg-black/30",
  };

  return (
    <div
      className={cn(
        // Base styling
        "relative px-4 py-3.5",
        // Gradient background matching FloatingTopBar
        gradients[variant],
        // Glass effect
        "backdrop-blur-xl",
        // Border matching FloatingTopBar
        "border-b border-white/10",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]",
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
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]",
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
 * Clean scrollable area with FloatingTopBar styling
 */
export const SchemaNodeBody = ({ children, className }) => {
  return (
    <div
      className={cn(
        // Dark background matching FileCodeViewer
        "bg-black/20 backdrop-blur-sm",
        // Scrollable with max height
        "overflow-y-auto overflow-x-hidden",
        // Custom scrollbar matching FileCodeViewer
        "scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20",
        "hover:scrollbar-thumb-white/30",
        // Subtle inner shadow
        "shadow-[inset_0_1px_4px_rgba(0,0,0,0.2)]",
        className
      )}
      style={{
        // Custom scrollbar styles for browsers that support it
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.2) rgba(255,255,255,0.05)",
      }}
    >
      {children}
    </div>
  );
};

/**
 * Enhanced Field Row
 * Clean and minimal with FloatingTopBar color scheme
 */
export const SchemaFieldRow = ({
  children,
  variant = "default",
  className,
}) => {
  const variants = {
    default: "hover:bg-white/10",
    relation:
      "bg-cyan-500/10 hover:bg-cyan-500/15 border-l-2 border-l-cyan-400/40 hover:border-l-cyan-400/60",
    enum: "bg-purple-500/10 hover:bg-purple-500/15 border-l-2 border-l-purple-400/40 hover:border-l-purple-400/60",
    primary:
      "bg-emerald-500/10 hover:bg-emerald-500/15 border-l-2 border-l-emerald-400/50 hover:border-l-emerald-400/70",
  };

  return (
    <div
      className={cn(
        // Base layout
        "flex items-center justify-between",
        "px-4 py-2.5",
        // Border matching FloatingTopBar
        "border-b border-white/5 last:border-b-0",
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
        <div className="flex-shrink-0 p-1.5 rounded bg-white/5 border border-white/10">
          {icon}
        </div>
      )}
      <span
        className={cn(
          "text-sm font-medium text-white/80",
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
        "text-xs font-mono px-2 py-0.5 rounded-lg",
        "text-white/60 group-hover:text-white/80",
        // Clean badge effect matching FloatingTopBar
        "bg-white/5 backdrop-blur-sm",
        "border border-white/10",
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
 * Clean footer matching FloatingTopBar
 */
export const SchemaNodeFooter = ({ children, className }) => {
  return (
    <div
      className={cn(
        // Glass background
        "bg-black/30 backdrop-blur-sm",
        // Padding
        "px-4 py-3",
        // Border matching FloatingTopBar
        "border-t border-white/10",
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
    default: "text-white/60 border-white/10",
    primary: "text-white/80 border-white/15",
    accent: "text-white border-white/20",
  };

  return (
    <span
      className={cn(
        "flex items-center gap-2",
        "px-2.5 py-1 rounded-lg",
        "bg-white/5 backdrop-blur-sm",
        "border",
        variants[variant],
        "transition-all duration-200",
        "hover:border-white/20 hover:bg-white/10",
        className
      )}
    >
      {children}
    </span>
  );
};

/**
 * Enhanced Animated Dot Indicator
 * Refined with FloatingTopBar colors
 */
export const StatusDot = ({ animated = false, color = "white", className }) => {
  const colors = {
    white: "bg-white/60 shadow-[0_0_6px_rgba(255,255,255,0.4)]",
    cyan: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]",
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
        "bg-white/5 backdrop-blur-sm",
        "border-y border-white/10",
        className
      )}
    >
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {label && (
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
};

/**
 * Badge for special field indicators (optional, unique, etc.)
 */
export const FieldBadge = ({ children, variant = "default", className }) => {
  const variants = {
    default: "bg-white/10 text-white/60 border-white/20",
    primary: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
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
