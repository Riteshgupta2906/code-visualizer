"use client";

import React, { forwardRef } from "react";
import { Maximize, Minus, Plus, Maximize2, Minimize2 } from "lucide-react";

import { Panel, useViewport, useStore, useReactFlow } from "@xyflow/react";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ZoomSlider = forwardRef(
  ({ className, allExpanded, onExpandAll, onCollapseAll, ...props }, ref) => {
    const { zoom } = useViewport();
    const { zoomTo, zoomIn, zoomOut, fitView } = useReactFlow();
    const minZoom = useStore((state) => state.minZoom);
    const maxZoom = useStore((state) => state.maxZoom);

    return (
      <Panel
        className={cn(
          "flex gap-2 rounded-2xl border border-white/20 backdrop-blur-xl bg-black/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] p-2",
          className
        )}
        ref={ref}
        {...props}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => zoomOut({ duration: 300 })}
          className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-200"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Slider
          className="w-[120px]"
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
          className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
        </Button>

        <Button
          className="min-w-16 h-8 tabular-nums text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all duration-200"
          variant="ghost"
          onClick={() => zoomTo(1, { duration: 300 })}
        >
          {(100 * zoom).toFixed(0)}%
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => fitView({ duration: 300 })}
          className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-200"
        >
          <Maximize className="h-4 w-4" />
        </Button>

        {/* Divider */}
        <div className="w-px h-8 bg-white/20" />

        {/* Expand/Collapse All Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={allExpanded ? onCollapseAll : onExpandAll}
          className="h-8 px-3 text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-200"
        >
          {allExpanded ? (
            <>
              <Minimize2 className="w-4 h-4 mr-2" />
              Collapse
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 mr-2" />
              Expand
            </>
          )}
        </Button>
      </Panel>
    );
  }
);

ZoomSlider.displayName = "ZoomSlider";
