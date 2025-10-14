import { useMemo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useStore,
} from "@xyflow/react";

export function DataEdge({
  data = { path: "bezier" },
  id,
  markerEnd,
  source,
  sourcePosition,
  sourceX,
  sourceY,
  style,
  targetPosition,
  targetX,
  targetY,
}) {
  const nodeData = useStore((state) => state.nodeLookup.get(source)?.data);
  const [edgePath, labelX, labelY] = getPath({
    type: data.path ?? "bezier",
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const label = useMemo(() => {
    // First check if the value is directly in edge data
    if (data.key && data[data.key]) {
      const value = data[data.key];

      switch (typeof value) {
        case "string":
        case "number":
          return value;
        case "object":
          return JSON.stringify(value);
        default:
          return "";
      }
    }

    // Otherwise, check in node data
    if (data.key && nodeData) {
      const value = nodeData[data.key];

      switch (typeof value) {
        case "string":
        case "number":
          return value;
        case "object":
          return JSON.stringify(value);
        default:
          return "";
      }
    }
  }, [data, nodeData]);

  // Calculate custom label position (80-90% towards target)
  const labelPositionRatio = data.labelPosition ?? 0.85; // Default 85%
  const actualLabelX = sourceX + (targetX - sourceX) * labelPositionRatio;
  const actualLabelY = sourceY + (targetY - sourceY) * labelPositionRatio;

  const transform = `translate(${actualLabelX}px,${actualLabelY}px) translate(-50%, -50%)`;

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {data.key && label && (
        <EdgeLabelRenderer>
          <div
            className="absolute rounded border bg-background px-2 py-1 text-foreground shadow-lg"
            style={{
              transform,
              backgroundColor: "#1F2937",
              borderColor: "rgba(75, 85, 99, 0.5)",
              color: "#E5E7EB",
            }}
          >
            <pre
              className="text-xs font-semibold"
              style={{
                fontFamily: "ui-monospace, monospace",
                margin: 0,
              }}
            >
              {label}
            </pre>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

/**
 * Chooses which of React Flow's edge path algorithms to use based on the provided
 * `type`.
 */
function getPath({
  type,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}) {
  switch (type) {
    case "bezier":
      return getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
      });

    case "smoothstep":
      return getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
      });

    case "step":
      return getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        borderRadius: 0,
      });

    case "straight":
      return getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
  }
}
