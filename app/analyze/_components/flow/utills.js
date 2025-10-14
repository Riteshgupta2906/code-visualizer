// import { getNodesBounds } from "@xyflow/react";

// // =============================================================================
// // SPACING CONFIGURATION - Adjusted for Left-to-Right Layout
// // =============================================================================

// const SPACING_CONFIG = {
//   // Horizontal Spacing (now represents depth/levels)
//   PARENT_CHILD_HORIZONTAL_DISTANCE: 450, // Distance between parent and child levels (was vertical)
//   FOLDER_HORIZONTAL_SPACING: 450, // Space for folder depth
//   FILE_HORIZONTAL_OFFSET: 0, // File positioning offset from base position
//   DEPENDENCY_HORIZONTAL_DISTANCE: 450, // Distance between files and their dependencies

//   // Vertical Spacing (now represents sibling spread)
//   FOLDER_TO_FOLDER_SPACING: 50, // Space between sibling folders (vertical now)
//   FILE_TO_FILE_SPACING: 100, // Space between files in same folder (vertical now)
//   DEPENDENCY_VERTICAL_SPACING: 180, // Vertical space between dependency nodes
//   TREE_WIDTH_PADDING: 450, // Additional width padding for tree branches (was height)

//   // Collision Avoidance
//   COLLISION_VERTICAL_INCREMENT: 150, // Vertical movement when avoiding collisions
//   COLLISION_HORIZONTAL_INCREMENT: 120, // Horizontal movement when avoiding collisions
//   COLLISION_PADDING: 20, // Minimum padding around nodes for collision detection
//   COLLISION_MAX_ATTEMPTS: 20, // Maximum attempts to find non-colliding position

//   // Node Dimensions
//   FOLDER_NODE_WIDTH: 260, // Width of folder nodes (increased for horizontal content)
//   FOLDER_NODE_HEIGHT: 80, // Height of folder nodes (reduced for compact vertical)
//   FILE_NODE_WIDTH: 260, // Width of file nodes (increased for horizontal content)
//   FILE_NODE_HEIGHT: 30, // Height of file nodes (reduced for compact vertical)
//   DEPENDENCY_NODE_WIDTH: 280, // Width of dependency nodes (increased for horizontal content)
//   DEPENDENCY_NODE_HEIGHT: 60, // Height of dependency nodes (reduced for compact vertical)

//   // Tree Layout
//   MINIMUM_TREE_HEIGHT: 300, // Minimum height for tree branches (was width)
//   ROOT_START_X: 100, // Starting X position for root node (was Y)
// };

// // =============================================================================
// // Tree layout calculation utilities - Adapted for Left-to-Right
// // =============================================================================

// export function createNodeId(path) {
//   return path.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-");
// }

// // Enhanced collision detection with configurable spacing
// function checkTightCollision(
//   proposedNode,
//   existingNodes,
//   minPadding = SPACING_CONFIG.COLLISION_PADDING
// ) {
//   if (existingNodes.length === 0) return false;

//   const proposedBounds = {
//     x: proposedNode.position.x - minPadding,
//     y: proposedNode.position.y - minPadding,
//     width:
//       (proposedNode.width || SPACING_CONFIG.FOLDER_NODE_WIDTH) + minPadding * 2,
//     height:
//       (proposedNode.height || SPACING_CONFIG.FOLDER_NODE_HEIGHT) +
//       minPadding * 2,
//   };

//   // Check against each existing node individually for precise collision
//   return existingNodes.some((node) => {
//     const nodeBounds = {
//       x: node.position.x - minPadding,
//       y: node.position.y - minPadding,
//       width: (node.width || SPACING_CONFIG.FOLDER_NODE_WIDTH) + minPadding * 2,
//       height:
//         (node.height || SPACING_CONFIG.FOLDER_NODE_HEIGHT) + minPadding * 2,
//     };

//     return !(
//       proposedBounds.x > nodeBounds.x + nodeBounds.width ||
//       proposedBounds.x + proposedBounds.width < nodeBounds.x ||
//       proposedBounds.y > nodeBounds.y + nodeBounds.height ||
//       proposedBounds.y + proposedBounds.height < nodeBounds.y
//     );
//   });
// }

// // Enhanced position finding with configurable collision avoidance
// function findCompactPosition(
//   initialPosition,
//   existingNodes,
//   nodeWidth = SPACING_CONFIG.FOLDER_NODE_WIDTH,
//   nodeHeight = SPACING_CONFIG.FOLDER_NODE_HEIGHT
// ) {
//   let position = { ...initialPosition };
//   let attempts = 0;
//   const maxAttempts = SPACING_CONFIG.COLLISION_MAX_ATTEMPTS;
//   const verticalIncrement = SPACING_CONFIG.COLLISION_VERTICAL_INCREMENT;
//   const horizontalIncrement = SPACING_CONFIG.COLLISION_HORIZONTAL_INCREMENT;

//   while (attempts < maxAttempts) {
//     const proposedNode = {
//       position,
//       width: nodeWidth,
//       height: nodeHeight,
//     };

//     if (
//       !checkTightCollision(
//         proposedNode,
//         existingNodes,
//         SPACING_CONFIG.COLLISION_PADDING
//       )
//     ) {
//       return position;
//     }

//     // Try different positioning strategies
//     if (attempts < 5) {
//       // First try moving vertically (was horizontally)
//       position.y += verticalIncrement;
//     } else if (attempts < 10) {
//       // Then try moving horizontally (was vertically)
//       position.x +=
//         attempts % 2 === 0 ? horizontalIncrement : -horizontalIncrement;
//     } else {
//       // Final attempts: combination of both
//       position.y += verticalIncrement * 0.5;
//       position.x += (attempts % 2 === 0 ? 1 : -1) * horizontalIncrement * 0.5;
//     }

//     attempts++;
//   }

//   // Final fallback with guaranteed spacing
//   return {
//     x:
//       initialPosition.x +
//       (attempts % 2 === 0 ? horizontalIncrement : -horizontalIncrement),
//     y: initialPosition.y + attempts * verticalIncrement,
//   };
// }

// // Calculate tree dimensions - NOW returns HEIGHT (vertical spread) instead of width
// export function calculateTreeDimensions(
//   nodeData,
//   path,
//   expandedNodes,
//   level = 0
// ) {
//   const nodeId = createNodeId(path);
//   const isExpanded = expandedNodes.has(nodeId);

//   if (!isExpanded || !nodeData.children) {
//     return {
//       height: SPACING_CONFIG.FOLDER_NODE_HEIGHT, // Single node height
//       width: SPACING_CONFIG.FOLDER_NODE_WIDTH,
//     };
//   }

//   const childFolders = nodeData.children.filter(
//     (child) => child.type === "folder"
//   );
//   const childFiles = nodeData.children.filter((child) => child.type === "file");

//   let totalHeight = 0; // Total vertical space needed (was width)
//   let maxWidth = SPACING_CONFIG.FOLDER_NODE_WIDTH; // Max horizontal depth (was height)

//   // Calculate total HEIGHT (vertical spread) with configurable spacing
//   childFolders.forEach((child) => {
//     const childPath = `${path}-${child.name}`;
//     const childDim = calculateTreeDimensions(
//       child,
//       childPath,
//       expandedNodes,
//       level + 1
//     );
//     totalHeight += childDim.height + SPACING_CONFIG.FOLDER_TO_FOLDER_SPACING;
//     maxWidth = Math.max(maxWidth, childDim.width);
//   });

//   if (childFiles.length > 0) {
//     totalHeight += childFiles.length * SPACING_CONFIG.FILE_TO_FILE_SPACING;
//   }

//   return {
//     height: Math.max(totalHeight, SPACING_CONFIG.MINIMUM_TREE_HEIGHT),
//     width: maxWidth + SPACING_CONFIG.TREE_WIDTH_PADDING,
//   };
// }

// export function buildTreeLayout(
//   rootData,
//   expandedNodes,
//   toggleNode,
//   onAnalyzeDependencies
// ) {
//   const nodes = [];
//   const edges = [];

//   function processNode(
//     nodeData,
//     path,
//     parentId,
//     level,
//     leftX, // Changed from centerX - now represents horizontal position (depth)
//     centerY, // Changed from topY - now represents vertical position (spread)
//     projectRoot
//   ) {
//     const nodeId = createNodeId(path);
//     const isExpanded = expandedNodes.has(nodeId);

//     const childFolders = nodeData.children
//       ? nodeData.children.filter((child) => child.type === "folder")
//       : [];
//     const childFiles = nodeData.children
//       ? nodeData.children.filter((child) => child.type === "file")
//       : [];

//     if (nodeData.type === "folder") {
//       const initialPosition = {
//         x: leftX, // Horizontal position based on depth
//         y: centerY - SPACING_CONFIG.FOLDER_NODE_HEIGHT / 2, // Centered vertically
//       };
//       const safePosition = findCompactPosition(
//         initialPosition,
//         nodes,
//         SPACING_CONFIG.FOLDER_NODE_WIDTH,
//         SPACING_CONFIG.FOLDER_NODE_HEIGHT
//       );

//       const folderNode = {
//         id: nodeId,
//         type: "folder",
//         position: safePosition,
//         width: SPACING_CONFIG.FOLDER_NODE_WIDTH,
//         height: SPACING_CONFIG.FOLDER_NODE_HEIGHT,
//         data: {
//           name: nodeData.name,
//           type: "folder",
//           isExpanded,
//           isAppRouter: nodeData.isAppRouter,
//           routingAnalysis: nodeData.routingAnalysis,
//           routePath: nodeData.routePath,
//           specialFiles: nodeData.specialFiles,
//           fileCount: childFiles.length,
//           folderCount: childFolders.length,
//           nodeId: nodeId,
//           onToggle: toggleNode,
//         },
//         draggable: true,
//       };

//       nodes.push(folderNode);

//       if (parentId) {
//         const edgeColor = nodeData.isAppRouter ? "#3b82f6" : "#6b7280";
//         edges.push({
//           id: `edge-${parentId}-${nodeId}`,
//           source: parentId,
//           target: nodeId,
//           type: "smoothstep",
//           style: {
//             stroke: edgeColor,
//             strokeWidth: nodeData.isAppRouter ? 3 : 2,
//           },
//         });
//       }
//     }

//     // Process children with configurable spacing
//     if (isExpanded && (childFolders.length > 0 || childFiles.length > 0)) {
//       const childX = leftX + SPACING_CONFIG.PARENT_CHILD_HORIZONTAL_DISTANCE; // Move right for children

//       // Calculate total vertical space needed for all children
//       let totalChildHeight = 0;
//       childFolders.forEach((child) => {
//         const childPath = `${path}-${child.name}`;
//         const childDim = calculateTreeDimensions(
//           child,
//           childPath,
//           expandedNodes,
//           level + 1
//         );
//         totalChildHeight +=
//           childDim.height + SPACING_CONFIG.FOLDER_TO_FOLDER_SPACING;
//       });
//       totalChildHeight +=
//         childFiles.length * SPACING_CONFIG.FILE_TO_FILE_SPACING;

//       let childY = centerY - totalChildHeight / 2; // Start from top of vertical spread

//       // Process child folders with configurable spacing
//       childFolders.forEach((child) => {
//         const childPath = `${path}-${child.name}`;
//         const childDim = calculateTreeDimensions(
//           child,
//           childPath,
//           expandedNodes,
//           level + 1
//         );
//         const childCenterY = childY + childDim.height / 2;

//         processNode(
//           child,
//           childPath,
//           nodeId,
//           level + 1,
//           childX,
//           childCenterY,
//           projectRoot
//         );
//         childY += childDim.height + SPACING_CONFIG.FOLDER_TO_FOLDER_SPACING;
//       });

//       // Process files with configurable spacing
//       childFiles.forEach((file, index) => {
//         const fileNodeId = `${nodeId}-file-${index}`;
//         const fileY = childY + SPACING_CONFIG.FILE_TO_FILE_SPACING / 2;

//         const initialPosition = {
//           x: childX + SPACING_CONFIG.FILE_HORIZONTAL_OFFSET,
//           y: fileY - SPACING_CONFIG.FILE_NODE_HEIGHT / 2,
//         };
//         const safePosition = findCompactPosition(
//           initialPosition,
//           nodes,
//           SPACING_CONFIG.FILE_NODE_WIDTH,
//           SPACING_CONFIG.FILE_NODE_HEIGHT
//         );

//         const filePath = file.fullPath || "";

//         const fileNode = {
//           id: fileNodeId,
//           type: "file",
//           position: safePosition,
//           width: SPACING_CONFIG.FILE_NODE_WIDTH,
//           height: SPACING_CONFIG.FILE_NODE_HEIGHT,
//           data: {
//             name: file.name,
//             type: "file",
//             isAppRouter: file.isAppRouter,
//             fileAnalysis: file.fileAnalysis,
//             filePath: filePath,
//             projectRoot: projectRoot,
//             nodeId: fileNodeId,
//             onAnalyzeDependencies: onAnalyzeDependencies,
//           },
//           draggable: true,
//         };

//         nodes.push(fileNode);

//         const edgeColor = file.isAppRouter ? "#10b981" : "#6b7280";
//         edges.push({
//           id: `edge-${nodeId}-${fileNodeId}`,
//           source: nodeId,
//           target: fileNodeId,
//           type: "smoothstep",
//           style: {
//             stroke: edgeColor,
//             strokeWidth: file.isAppRouter ? 2.5 : 1.5,
//           },
//         });

//         childY += SPACING_CONFIG.FILE_TO_FILE_SPACING;
//       });
//     }
//   }

//   const projectRoot = rootData.projectRoot || "";
//   processNode(
//     rootData,
//     "root",
//     null,
//     0,
//     SPACING_CONFIG.ROOT_START_X, // Start from left
//     0, // Centered vertically at 0
//     projectRoot
//   );

//   return { nodes, edges };
// }

// // Dependencies go FURTHER RIGHT and stack VERTICALLY
// export function createDependencyNodes(
//   dependencies,
//   parentFileNodeId,
//   parentPosition,
//   existingNodes = []
// ) {
//   const nodes = [];
//   const edges = [];

//   const { localDependencies, externalDependencies } = dependencies;
//   const allDeps = [
//     ...(localDependencies || []),
//     ...(externalDependencies || []),
//   ];

//   if (allDeps.length === 0) {
//     return { nodes, edges };
//   }

//   // Dependency layout: Go RIGHT from file, stack VERTICALLY
//   const childX =
//     parentPosition.x + SPACING_CONFIG.DEPENDENCY_HORIZONTAL_DISTANCE; // Move right
//   const depNodeHeight = SPACING_CONFIG.DEPENDENCY_NODE_HEIGHT;
//   const verticalSpacing = SPACING_CONFIG.DEPENDENCY_VERTICAL_SPACING;
//   const totalChildHeight = allDeps.length * verticalSpacing;
//   let childY = parentPosition.y - totalChildHeight / 2; // Center vertically around parent

//   allDeps.forEach((dep, index) => {
//     const depY = childY + verticalSpacing / 2;
//     const initialPosition = {
//       x: childX,
//       y: depY - depNodeHeight / 2,
//     };
//     const safePosition = findCompactPosition(
//       initialPosition,
//       [...existingNodes, ...nodes],
//       SPACING_CONFIG.DEPENDENCY_NODE_WIDTH,
//       depNodeHeight
//     );

//     const nodeId = `${parentFileNodeId}-dep-${dep.nodeId || dep.uiId || index}`;
//     const dependencyNode = {
//       id: nodeId,
//       type: "dependency",
//       position: safePosition,
//       width: SPACING_CONFIG.DEPENDENCY_NODE_WIDTH,
//       height: depNodeHeight,
//       data: {
//         name: dep.name,
//         type: "dependency",
//         dependencyInfo: dep,
//         isLocal: dep.isLocal,
//         exists: dep.exists,
//         resolvedPath: dep.resolvedPath,
//         packageName: dep.packageName,
//         importType: dep.type,
//         specifiers: dep.specifiers,
//         dependencyId: dep.id,
//         nodeId: dep.nodeId,
//         uiId: dep.uiId,
//       },
//       draggable: true,
//     };

//     nodes.push(dependencyNode);

//     const edgeColor = dep.isLocal ? "#10b981" : "#6366f1";
//     const edge = {
//       id: `edge-${parentFileNodeId}-${nodeId}`,
//       source: parentFileNodeId,
//       target: nodeId,
//       type: "smoothstep",
//       style: {
//         stroke: edgeColor,
//         strokeWidth: dep.isLocal ? 2.5 : 1.5,
//         strokeDasharray: dep.isLocal ? "0" : "5,5",
//       },
//     };

//     edges.push(edge);
//     childY += verticalSpacing;
//   });

//   return { nodes, edges };
// }

// export function mergeDependencyNodes(baseNodes, dependencyAnalysisResults) {
//   const dependencyNodes = [];
//   const dependencyEdges = [];

//   dependencyAnalysisResults.forEach((depData, fileNodeId) => {
//     const fileNode = baseNodes.find((n) => n.id === fileNodeId);
//     if (fileNode) {
//       const allExistingNodes = [...baseNodes, ...dependencyNodes];
//       const { nodes, edges } = createDependencyNodes(
//         depData,
//         fileNodeId,
//         fileNode.position,
//         allExistingNodes
//       );
//       dependencyNodes.push(...nodes);
//       dependencyEdges.push(...edges);
//     }
//   });

//   return { dependencyNodes, dependencyEdges };
// }

// // Export the configuration for external access if needed
// export { SPACING_CONFIG };

import { getNodesBounds } from "@xyflow/react";

// =============================================================================
// SPACING CONFIGURATION - Adjusted for Left-to-Right Layout
// =============================================================================

const SPACING_CONFIG = {
  // Horizontal Spacing (now represents depth/levels)
  PARENT_CHILD_HORIZONTAL_DISTANCE: 600,
  FOLDER_HORIZONTAL_SPACING: 600,
  FILE_HORIZONTAL_OFFSET: 0,
  DEPENDENCY_HORIZONTAL_DISTANCE: 450,

  // Vertical Spacing (now represents sibling spread)
  FOLDER_TO_FOLDER_SPACING: 50,
  FILE_TO_FILE_SPACING: 100,
  DEPENDENCY_VERTICAL_SPACING: 100,
  TREE_WIDTH_PADDING: 450,

  // Collision Avoidance
  COLLISION_VERTICAL_INCREMENT: 150,
  COLLISION_HORIZONTAL_INCREMENT: 120,
  COLLISION_PADDING: 20,
  COLLISION_MAX_ATTEMPTS: 20,

  // Node Dimensions
  FOLDER_NODE_WIDTH: 260,
  FOLDER_NODE_HEIGHT: 80,
  FILE_NODE_WIDTH: 260,
  FILE_NODE_HEIGHT: 30,
  DEPENDENCY_NODE_WIDTH: 280,
  DEPENDENCY_NODE_HEIGHT: 40,

  // Tree Layout
  MINIMUM_TREE_HEIGHT: 300,
  ROOT_START_X: 100,
};

// =============================================================================
// Tree layout calculation utilities
// =============================================================================

export function createNodeId(path) {
  return path.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-");
}

function checkTightCollision(
  proposedNode,
  existingNodes,
  minPadding = SPACING_CONFIG.COLLISION_PADDING
) {
  if (existingNodes.length === 0) return false;

  const proposedBounds = {
    x: proposedNode.position.x - minPadding,
    y: proposedNode.position.y - minPadding,
    width:
      (proposedNode.width || SPACING_CONFIG.FOLDER_NODE_WIDTH) + minPadding * 2,
    height:
      (proposedNode.height || SPACING_CONFIG.FOLDER_NODE_HEIGHT) +
      minPadding * 2,
  };

  return existingNodes.some((node) => {
    const nodeBounds = {
      x: node.position.x - minPadding,
      y: node.position.y - minPadding,
      width: (node.width || SPACING_CONFIG.FOLDER_NODE_WIDTH) + minPadding * 2,
      height:
        (node.height || SPACING_CONFIG.FOLDER_NODE_HEIGHT) + minPadding * 2,
    };

    return !(
      proposedBounds.x > nodeBounds.x + nodeBounds.width ||
      proposedBounds.x + proposedBounds.width < nodeBounds.x ||
      proposedBounds.y > nodeBounds.y + nodeBounds.height ||
      proposedBounds.y + proposedBounds.height < nodeBounds.y
    );
  });
}

function findCompactPosition(
  initialPosition,
  existingNodes,
  nodeWidth = SPACING_CONFIG.FOLDER_NODE_WIDTH,
  nodeHeight = SPACING_CONFIG.FOLDER_NODE_HEIGHT
) {
  let position = { ...initialPosition };
  let attempts = 0;
  const maxAttempts = SPACING_CONFIG.COLLISION_MAX_ATTEMPTS;
  const verticalIncrement = SPACING_CONFIG.COLLISION_VERTICAL_INCREMENT;
  const horizontalIncrement = SPACING_CONFIG.COLLISION_HORIZONTAL_INCREMENT;

  while (attempts < maxAttempts) {
    const proposedNode = { position, width: nodeWidth, height: nodeHeight };

    if (
      !checkTightCollision(
        proposedNode,
        existingNodes,
        SPACING_CONFIG.COLLISION_PADDING
      )
    ) {
      return position;
    }

    if (attempts < 5) {
      position.y += verticalIncrement;
    } else if (attempts < 10) {
      position.x +=
        attempts % 2 === 0 ? horizontalIncrement : -horizontalIncrement;
    } else {
      position.y += verticalIncrement * 0.5;
      position.x += (attempts % 2 === 0 ? 1 : -1) * horizontalIncrement * 0.5;
    }

    attempts++;
  }

  return {
    x:
      initialPosition.x +
      (attempts % 2 === 0 ? horizontalIncrement : -horizontalIncrement),
    y: initialPosition.y + attempts * verticalIncrement,
  };
}

export function calculateTreeDimensions(
  nodeData,
  path,
  expandedNodes,
  level = 0
) {
  const nodeId = createNodeId(path);
  const isExpanded = expandedNodes.has(nodeId);

  if (!isExpanded || !nodeData.children) {
    return {
      height: SPACING_CONFIG.FOLDER_NODE_HEIGHT,
      width: SPACING_CONFIG.FOLDER_NODE_WIDTH,
    };
  }

  const childFolders = nodeData.children.filter(
    (child) => child.type === "folder"
  );
  const childFiles = nodeData.children.filter((child) => child.type === "file");

  let totalHeight = 0;
  let maxWidth = SPACING_CONFIG.FOLDER_NODE_WIDTH;

  childFolders.forEach((child) => {
    const childPath = `${path}-${child.name}`;
    const childDim = calculateTreeDimensions(
      child,
      childPath,
      expandedNodes,
      level + 1
    );
    totalHeight += childDim.height + SPACING_CONFIG.FOLDER_TO_FOLDER_SPACING;
    maxWidth = Math.max(maxWidth, childDim.width);
  });

  if (childFiles.length > 0) {
    totalHeight += childFiles.length * SPACING_CONFIG.FILE_TO_FILE_SPACING;
  }

  return {
    height: Math.max(totalHeight, SPACING_CONFIG.MINIMUM_TREE_HEIGHT),
    width: maxWidth + SPACING_CONFIG.TREE_WIDTH_PADDING,
  };
}

// =============================================================================
// EDGE CREATION WITH DATA REFERENCE
// =============================================================================

/**
 * Creates an edge that uses DataEdge to display target node's data
 * @param {string} sourceId - Source node ID
 * @param {string} targetId - Target node ID
 * @param {string} dataKey - Key in target node's data to display (e.g., 'name')
 * @param {boolean} isAppRouter - Whether this is an app router route
 * @param {string} edgeType - Type of edge (folder/file/dependency)
 */
function createDataEdge(
  sourceId,
  targetId,
  dataKey = "name",
  isAppRouter = false,
  edgeType = "folder"
) {
  // Determine edge color based on type
  let strokeColor = "#6b7280";
  let strokeWidth = 2;

  if (edgeType === "folder") {
    strokeColor = isAppRouter ? "#3b82f6" : "#6b7280";
    strokeWidth = isAppRouter ? 3 : 2;
  } else if (edgeType === "file") {
    strokeColor = isAppRouter ? "#10b981" : "#6b7280";
    strokeWidth = isAppRouter ? 2.5 : 1.5;
  } else if (edgeType === "dependency-local") {
    strokeColor = "#10b981";
    strokeWidth = 2.5;
  } else if (edgeType === "dependency-external") {
    strokeColor = "#6366f1";
    strokeWidth = 1.5;
  }

  const edge = {
    id: `edge-${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    type: "routeDataEdge", // Our custom edge type
    animated: false,
    data: {
      key: dataKey, // Tell the edge which field to display from target node
    },
    style: {
      stroke: strokeColor,
      strokeWidth: strokeWidth,
    },
  };

  // Add dashed line for external dependencies
  if (edgeType === "dependency-external") {
    edge.style.strokeDasharray = "5,5";
  }

  return edge;
}

// =============================================================================
// TREE LAYOUT BUILDER
// =============================================================================

export function buildTreeLayout(
  rootData,
  expandedNodes,
  toggleNode,
  onAnalyzeDependencies
) {
  const nodes = [];
  const edges = [];

  function processNode(
    nodeData,
    path,
    parentId,
    level,
    leftX,
    centerY,
    projectRoot
  ) {
    const nodeId = createNodeId(path);
    const isExpanded = expandedNodes.has(nodeId);

    const childFolders = nodeData.children
      ? nodeData.children.filter((child) => child.type === "folder")
      : [];
    const childFiles = nodeData.children
      ? nodeData.children.filter((child) => child.type === "file")
      : [];

    if (nodeData.type === "folder") {
      const initialPosition = {
        x: leftX,
        y: centerY - SPACING_CONFIG.FOLDER_NODE_HEIGHT / 2,
      };
      const safePosition = findCompactPosition(
        initialPosition,
        nodes,
        SPACING_CONFIG.FOLDER_NODE_WIDTH,
        SPACING_CONFIG.FOLDER_NODE_HEIGHT
      );

      const folderNode = {
        id: nodeId,
        type: "folder",
        position: safePosition,
        width: SPACING_CONFIG.FOLDER_NODE_WIDTH,
        height: SPACING_CONFIG.FOLDER_NODE_HEIGHT,
        data: {
          name: nodeData.name, // IMPORTANT: Store name in data for DataEdge
          type: "folder",
          isExpanded,
          isAppRouter: nodeData.isAppRouter,
          routingAnalysis: nodeData.routingAnalysis,
          routePath: nodeData.routePath,
          specialFiles: nodeData.specialFiles,
          fileCount: childFiles.length,
          folderCount: childFolders.length,
          nodeId: nodeId,
          onToggle: toggleNode,
        },
        draggable: true,
      };

      nodes.push(folderNode);

      // Create edge with data reference
      if (parentId) {
        edges.push(
          createDataEdge(
            parentId,
            nodeId,
            "name", // Display the 'name' field from target node
            nodeData.isAppRouter,
            "folder"
          )
        );
      }
    }

    // Process children
    if (isExpanded && (childFolders.length > 0 || childFiles.length > 0)) {
      const childX = leftX + SPACING_CONFIG.PARENT_CHILD_HORIZONTAL_DISTANCE;

      let totalChildHeight = 0;
      childFolders.forEach((child) => {
        const childPath = `${path}-${child.name}`;
        const childDim = calculateTreeDimensions(
          child,
          childPath,
          expandedNodes,
          level + 1
        );
        totalChildHeight +=
          childDim.height + SPACING_CONFIG.FOLDER_TO_FOLDER_SPACING;
      });
      totalChildHeight +=
        childFiles.length * SPACING_CONFIG.FILE_TO_FILE_SPACING;

      let childY = centerY - totalChildHeight / 2;

      // Process child folders
      childFolders.forEach((child) => {
        const childPath = `${path}-${child.name}`;
        const childDim = calculateTreeDimensions(
          child,
          childPath,
          expandedNodes,
          level + 1
        );
        const childCenterY = childY + childDim.height / 2;

        processNode(
          child,
          childPath,
          nodeId,
          level + 1,
          childX,
          childCenterY,
          projectRoot
        );
        childY += childDim.height + SPACING_CONFIG.FOLDER_TO_FOLDER_SPACING;
      });

      // Process files
      childFiles.forEach((file, index) => {
        const fileNodeId = `${nodeId}-file-${index}`;
        const fileY = childY + SPACING_CONFIG.FILE_TO_FILE_SPACING / 2;

        const initialPosition = {
          x: childX + SPACING_CONFIG.FILE_HORIZONTAL_OFFSET,
          y: fileY - SPACING_CONFIG.FILE_NODE_HEIGHT / 2,
        };
        const safePosition = findCompactPosition(
          initialPosition,
          nodes,
          SPACING_CONFIG.FILE_NODE_WIDTH,
          SPACING_CONFIG.FILE_NODE_HEIGHT
        );

        const filePath = file.fullPath || "";

        const fileNode = {
          id: fileNodeId,
          type: "file",
          position: safePosition,
          width: SPACING_CONFIG.FILE_NODE_WIDTH,
          height: SPACING_CONFIG.FILE_NODE_HEIGHT,
          data: {
            name: file.name, // IMPORTANT: Store name in data for DataEdge
            type: "file",
            isAppRouter: file.isAppRouter,
            fileAnalysis: file.fileAnalysis,
            filePath: filePath,
            projectRoot: projectRoot,
            nodeId: fileNodeId,
            onAnalyzeDependencies: onAnalyzeDependencies,
          },
          draggable: true,
        };

        nodes.push(fileNode);

        // Create edge with data reference
        edges.push(
          createDataEdge(
            nodeId,
            fileNodeId,
            "name", // Display the 'name' field from target node
            file.isAppRouter,
            "file"
          )
        );

        childY += SPACING_CONFIG.FILE_TO_FILE_SPACING;
      });
    }
  }

  const projectRoot = rootData.projectRoot || "";
  processNode(
    rootData,
    "root",
    null,
    0,
    SPACING_CONFIG.ROOT_START_X,
    0,
    projectRoot
  );

  return { nodes, edges };
}

// =============================================================================
// DEPENDENCY NODES
// =============================================================================

export function createDependencyNodes(
  dependencies,
  parentFileNodeId,
  parentPosition,
  existingNodes = []
) {
  const nodes = [];
  const edges = [];

  const { localDependencies, externalDependencies } = dependencies;
  const allDeps = [
    ...(localDependencies || []),
    ...(externalDependencies || []),
  ];

  if (allDeps.length === 0) {
    return { nodes, edges };
  }

  const childX =
    parentPosition.x + SPACING_CONFIG.DEPENDENCY_HORIZONTAL_DISTANCE;
  const depNodeHeight = SPACING_CONFIG.DEPENDENCY_NODE_HEIGHT;
  const verticalSpacing = SPACING_CONFIG.DEPENDENCY_VERTICAL_SPACING;
  const totalChildHeight = allDeps.length * verticalSpacing;
  let childY = parentPosition.y - totalChildHeight / 2;

  allDeps.forEach((dep, index) => {
    const depY = childY + verticalSpacing / 2;
    const initialPosition = {
      x: childX,
      y: depY - depNodeHeight / 2,
    };
    const safePosition = findCompactPosition(
      initialPosition,
      [...existingNodes, ...nodes],
      SPACING_CONFIG.DEPENDENCY_NODE_WIDTH,
      depNodeHeight
    );

    const nodeId = `${parentFileNodeId}-dep-${dep.nodeId || dep.uiId || index}`;
    const dependencyNode = {
      id: nodeId,
      type: "dependency",
      position: safePosition,
      width: SPACING_CONFIG.DEPENDENCY_NODE_WIDTH,
      height: depNodeHeight,
      data: {
        name: dep.name, // IMPORTANT: Store name in data for DataEdge
        type: "dependency",
        dependencyInfo: dep,
        isLocal: dep.isLocal,
        exists: dep.exists,
        resolvedPath: dep.resolvedPath,
        packageName: dep.packageName,
        importType: dep.type,
        specifiers: dep.specifiers,
        dependencyId: dep.id,
        nodeId: dep.nodeId,
        uiId: dep.uiId,
      },
      draggable: true,
    };

    nodes.push(dependencyNode);

    // Create edge with data reference
    const edgeType = dep.isLocal ? "dependency-local" : "dependency-external";
    edges.push(
      createDataEdge(
        parentFileNodeId,
        nodeId,
        "name", // Display the 'name' field from target node
        false,
        edgeType
      )
    );

    childY += verticalSpacing;
  });

  return { nodes, edges };
}

export function mergeDependencyNodes(baseNodes, dependencyAnalysisResults) {
  const dependencyNodes = [];
  const dependencyEdges = [];

  dependencyAnalysisResults.forEach((depData, fileNodeId) => {
    const fileNode = baseNodes.find((n) => n.id === fileNodeId);
    if (fileNode) {
      const allExistingNodes = [...baseNodes, ...dependencyNodes];
      const { nodes, edges } = createDependencyNodes(
        depData,
        fileNodeId,
        fileNode.position,
        allExistingNodes
      );
      dependencyNodes.push(...nodes);
      dependencyEdges.push(...edges);
    }
  });

  return { dependencyNodes, dependencyEdges };
}

export { SPACING_CONFIG };
