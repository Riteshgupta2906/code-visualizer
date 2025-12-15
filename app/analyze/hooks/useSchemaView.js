import { useState, useEffect, useMemo, useCallback } from "react";
import { analyzeSchemaForGraph } from "@/lib/analyzers/schemaAnalyzer";
import SchemaNode from "../_components/flow/Schemaenumnode";
import * as d3 from "d3";

/**
 * Accurately estimate node height based on component structure
 */
function estimateNodeHeight(node) {
  // Header height (SchemaNodeHeader)
  const headerHeight = 56; // py-3.5 = 14px top + 14px bottom + content ~28px

  // Footer height (SchemaNodeFooter)
  const footerHeight = 48; // py-3 = 12px top + 12px bottom + content ~24px

  // Field rows (SchemaFieldRow)
  const fieldCount = node.data?.schema?.length || 0;
  const fieldRowHeight = 44; // py-2.5 = 10px top + 10px bottom + content ~24px
  const totalFieldsHeight = fieldCount * fieldRowHeight;

  // Model-level constraints section (if exists)
  const constraints = node.data?.constraints || [];
  const hasConstraints = constraints.length > 0;

  let constraintsHeight = 0;
  if (hasConstraints) {
    // Divider height
    constraintsHeight += 40; // SchemaFieldDivider
    // Each constraint row
    constraintsHeight += constraints.length * 32; // Smaller rows for constraints
  }

  // Indexes section (if exists)
  const indexes = node.data?.indexes || [];
  const uniqueIndexes = node.data?.uniqueIndexes || [];
  const totalIndexes = indexes.length + uniqueIndexes.length;

  let indexesHeight = 0;
  if (totalIndexes > 0) {
    // Divider height
    indexesHeight += 40;
    // Each index row
    indexesHeight += totalIndexes * 32;
  }

  // Add some padding and borders
  const padding = 20; // Additional spacing for borders, margins, etc.

  const totalHeight =
    headerHeight +
    totalFieldsHeight +
    constraintsHeight +
    indexesHeight +
    footerHeight +
    padding;

  // Set minimum and maximum heights
  const minHeight = 180;
  const maxHeight = 1200; // Prevent extremely tall nodes

  return Math.min(Math.max(totalHeight, minHeight), maxHeight);
}

/**
 * Calculate node width (fixed for schema nodes)
 */
function getNodeWidth() {
  return 320; // Fixed width from SchemaNodeContainer
}

/**
 * Apply d3-force layout for optimal positioning
 */
function applyForceLayout(
  nodes,
  edges,
  viewportWidth = 1920,
  viewportHeight = 1080
) {
  if (!nodes || nodes.length === 0) return nodes;

  console.log("🎯 Starting force layout with:", {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    viewport: { viewportWidth, viewportHeight },
  });

  // ✅ Create SEPARATE simulation nodes (don't mutate originals)
  const simulationNodes = nodes.map((node) => {
    const height = estimateNodeHeight(node);
    console.log(
      `📏 Node ${node.data.label}: height=${height}px, fields=${node.data.schema.length}`
    );

    return {
      id: node.id,
      width: getNodeWidth(),
      height: height,
      x: node.position?.x || Math.random() * viewportWidth,
      y: node.position?.y || Math.random() * viewportHeight,
    };
  });

  // ✅ Create SEPARATE simulation edges
  const simulationEdges = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  }));

  // Create d3 simulation with SEPARATE data
  const simulation = d3
    .forceSimulation(simulationNodes)
    // Center force - pulls nodes toward center
    .force("center", d3.forceCenter(viewportWidth / 2, viewportHeight / 2))

    // Link force - keeps connected nodes close
    .force(
      "link",
      d3
        .forceLink(simulationEdges)
        .id((d) => d.id)
        .distance(350) // ✅ Increased from 300 to give more space
        .strength(0.4) // ✅ Reduced from 0.5 for more flexibility
    )

    // Collision force - prevents overlap (CRITICAL)
    .force(
      "collision",
      d3
        .forceCollide()
        .radius((d) => {
          // ✅ Use the larger dimension + generous padding
          const maxDimension = Math.max(d.width, d.height);
          const radius = maxDimension / 2 + 60; // ✅ Increased padding from 50 to 60
          return radius;
        })
        .strength(1.0) // ✅ Increased from 0.8 to 1.0 for stronger collision prevention
        .iterations(3) // ✅ Added more collision iterations for better results
    )

    // Charge force - nodes repel each other
    .force(
      "charge",
      d3
        .forceManyBody()
        .strength(-1500) // ✅ Increased repulsion from -1000 to -1500
        .distanceMax(1000) // ✅ Increased from 800
    )

    // X and Y forces - keep nodes in viewport bounds
    .force("x", d3.forceX(viewportWidth / 2).strength(0.03)) // ✅ Reduced from 0.05
    .force("y", d3.forceY(viewportHeight / 2).strength(0.03)); // ✅ Reduced from 0.05

  // Run simulation synchronously
  const numTicks = 400; // ✅ Increased from 300 for better convergence
  for (let i = 0; i < numTicks; i++) {
    simulation.tick();

    // Log progress every 100 ticks
    if (i % 100 === 0) {
      console.log(`⚡ Simulation tick ${i}/${numTicks}`);
    }
  }

  // Stop simulation
  simulation.stop();

  console.log("✅ Force layout complete");

  // ✅ Map positions back to original nodes (create clean copies)
  const positionMap = new Map();
  simulationNodes.forEach((simNode) => {
    positionMap.set(simNode.id, {
      x: simNode.x - simNode.width / 2,
      y: simNode.y - simNode.height / 2,
    });
  });

  // ✅ Return clean node copies with ONLY position updated
  return nodes.map((node) => ({
    ...node,
    position: positionMap.get(node.id) || node.position,
  }));
}

/**
 * Custom hook for managing schema view (Prisma models)
 */
export function useSchemaView(
  schemaPath,
  prismaInfo,
  viewportWidth,
  viewportHeight,
  selectedModel = null
) {
  const [schemaData, setSchemaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load schema when path changes
  useEffect(() => {
    if (schemaPath) {
      loadSchema(schemaPath);
    } else {
      setSchemaData(null);
    }
  }, [schemaPath]);

  const loadSchema = async (path) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeSchemaForGraph(path);
      console.log("📦 Schema Analysis Data (before layout):", data);
      setSchemaData(data);
    } catch (err) {
      console.error("❌ Failed to load schema:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get list of all models for the dropdown
  const allModels = useMemo(() => {
    if (!schemaData?.nodes) return [];
    return schemaData.nodes
      .filter((n) => n.data?.modelType === "model")
      .map((n) => n.data.label)
      .sort();
  }, [schemaData]);

  // Build graph data from schema with force layout
  const graphData = useMemo(() => {
    if (!schemaData) {
      return {
        nodes: [],
        edges: [],
        nodeTypes: {},
      };
    }

    // Filter nodes and edges if a model is selected
    let nodesToRender = schemaData.nodes;
    let edgesToRender = schemaData.edges;

    if (selectedModel) {
      // Find the selected node
      const targetNode = schemaData.nodes.find(
        (n) => n.data.label === selectedModel
      );

      if (targetNode) {
        // Find connected edges
        const connectedEdges = schemaData.edges.filter(
          (edge) => edge.source === targetNode.id || edge.target === targetNode.id
        );

        // Find connected nodes (neighbors)
        const neighborIds = new Set();
        connectedEdges.forEach((edge) => {
          neighborIds.add(edge.source);
          neighborIds.add(edge.target);
        });

        // Add the target node itself
        neighborIds.add(targetNode.id);

        // Filter nodes
        nodesToRender = schemaData.nodes.filter((node) =>
          neighborIds.has(node.id)
        );
        edgesToRender = connectedEdges;
      }
    }

    // If a model is selected, we filter and apply force layout to cluster them
    if (selectedModel) {
      // Apply d3-force layout ONLY for localized view to position nodes optimally
      const layoutedNodes = applyForceLayout(
        nodesToRender,
        edgesToRender,
        viewportWidth || 1920,
        viewportHeight || 1080
      );

      console.log("🎨 Schema Analysis Data (filtered & forced):", {
        nodes: layoutedNodes,
        edges: edgesToRender,
      });

      return {
        nodes: layoutedNodes,
        edges: edgesToRender,
        nodeTypes: {
          databaseSchema: SchemaNode,
        },
      };
    } else {
      // For full view, use the Server-Side Dagre layout positions
      // We just need to ensure we return the nodes structure correctly
      console.log("🎨 Schema Analysis Data (using server layout):", {
        nodes: nodesToRender,
        edges: edgesToRender,
      });

      return {
        nodes: nodesToRender,
        edges: edgesToRender,
        nodeTypes: {
          databaseSchema: SchemaNode,
        },
      };
    }
  }, [schemaData, viewportWidth, viewportHeight, selectedModel]);

  // Node click handler for schema nodes
  const onNodeClick = useCallback((event, node) => {
    event.stopPropagation();
    console.log("🖱️ Schema node clicked:", node);
    // Future: Show model details, expand/collapse fields, etc.
  }, []);

  // Get node color for minimap
  const getNodeColor = useCallback((node) => {
    const modelType = node.data?.modelType;
    switch (modelType) {
      case "enum":
        return "#8b5cf6"; // Purple for enums
      case "model":
      default:
        return "#3b82f6"; // Blue for models
    }
  }, []);

  return {
    nodes: graphData.nodes,
    edges: graphData.edges,
    nodeTypes: graphData.nodeTypes,
    loading,
    loadingMessage: schemaData
      ? `Analyzing ${schemaData.fileName}...`
      : "Loading schema...",
    error,
    onNodeClick,
    getNodeColor,
    schemaData,
    allModels, // Expose all models
  };
}
