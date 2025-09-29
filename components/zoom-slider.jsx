"use client";

import React, { forwardRef } from "react";
import { Maximize, Minus, Plus } from "lucide-react";

import { Panel, useViewport, useStore, useReactFlow } from "@xyflow/react";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ZoomSlider = forwardRef(({ className, ...props }, ref) => {
  const { zoom } = useViewport();
  const { zoomTo, zoomIn, zoomOut, fitView } = useReactFlow();
  const minZoom = useStore((state) => state.minZoom);
  const maxZoom = useStore((state) => state.maxZoom);

  return (
    <Panel
      className={cn(
        "flex gap-2 rounded-xl border border-gray-700/50 bg-gray-900/80 backdrop-blur-xl shadow-2xl p-2",
        className
      )}
      ref={ref}
      {...props}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => zoomOut({ duration: 300 })}
        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
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
        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Button
        className="min-w-16 h-8 tabular-nums text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 transition-colors"
        variant="ghost"
        onClick={() => zoomTo(1, { duration: 300 })}
      >
        {(100 * zoom).toFixed(0)}%
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => fitView({ duration: 300 })}
        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Maximize className="h-4 w-4" />
      </Button>
    </Panel>
  );
});

ZoomSlider.displayName = "ZoomSlider";
