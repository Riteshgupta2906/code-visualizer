import { getNodesBounds } from "@xyflow/react";

// =============================================================================
// SPACING CONFIGURATION - Adjust these values to control layout spacing
// =============================================================================

const SPACING_CONFIG = {
  // Horizontal Spacing
  FOLDER_TO_FOLDER_SPACING: 100, // Space between sibling folders
  FILE_TO_FILE_SPACING: 280, // Space between files in same folder
  DEPENDENCY_HORIZONTAL_SPACING: 300, // Space between dependency nodes
  FILE_POSITION_OFFSET: 140, // File positioning offset from base position

  // Vertical Spacing
  PARENT_CHILD_VERTICAL_DISTANCE: 300, // Distance between parent and child levels
  TREE_HEIGHT_PADDING: 300, // Additional height padding for tree branches
  FILE_DEPENDENCY_DISTANCE: 300, // Distance between files and their dependencies

  // Collision Avoidance
  COLLISION_VERTICAL_INCREMENT: 150, // Vertical movement when avoiding collisions
  COLLISION_HORIZONTAL_INCREMENT: 120, // Horizontal movement when avoiding collisions
  COLLISION_PADDING: 20, // Minimum padding around nodes for collision detection
  COLLISION_MAX_ATTEMPTS: 20, // Maximum attempts to find non-colliding position

  // Node Dimensions
  FOLDER_NODE_WIDTH: 240, // Width of folder nodes
  FOLDER_NODE_HEIGHT: 100, // Height of folder nodes
  FILE_NODE_WIDTH: 180, // Width of file nodes
  FILE_NODE_HEIGHT: 100, // Height of file nodes
  DEPENDENCY_NODE_WIDTH: 200, // Width of dependency nodes
  DEPENDENCY_NODE_HEIGHT: 100, // Height of dependency nodes

  // Tree Layout
  MINIMUM_TREE_WIDTH: 300, // Minimum width for tree branches
  ROOT_START_Y: 100, // Starting Y position for root node
};

// =============================================================================
// Tree layout calculation utilities
// =============================================================================

export function createNodeId(path) {
  return path.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-");
}

// Enhanced collision detection with configurable spacing
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

  // Check against each existing node individually for precise collision
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

// Enhanced position finding with configurable collision avoidance
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
    const proposedNode = {
      position,
      width: nodeWidth,
      height: nodeHeight,
    };

    if (
      !checkTightCollision(
        proposedNode,
        existingNodes,
        SPACING_CONFIG.COLLISION_PADDING
      )
    ) {
      return position;
    }

    // Try different positioning strategies
    if (attempts < 5) {
      // First try moving down
      position.y += verticalIncrement;
    } else if (attempts < 10) {
      // Then try moving horizontally
      position.x +=
        attempts % 2 === 0 ? horizontalIncrement : -horizontalIncrement;
    } else {
      // Final attempts: combination of both
      position.y += verticalIncrement * 0.5;
      position.x += (attempts % 2 === 0 ? 1 : -1) * horizontalIncrement * 0.5;
    }

    attempts++;
  }

  // Final fallback with guaranteed spacing
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
    return { width: 260, height: SPACING_CONFIG.FOLDER_NODE_HEIGHT };
  }

  const childFolders = nodeData.children.filter(
    (child) => child.type === "folder"
  );
  const childFiles = nodeData.children.filter((child) => child.type === "file");

  let totalWidth = 0;
  let maxHeight = SPACING_CONFIG.FOLDER_NODE_HEIGHT;

  // Calculate total width with configurable spacing
  childFolders.forEach((child) => {
    const childPath = `${path}-${child.name}`;
    const childDim = calculateTreeDimensions(
      child,
      childPath,
      expandedNodes,
      level + 1
    );
    totalWidth += childDim.width + SPACING_CONFIG.FOLDER_TO_FOLDER_SPACING;
    maxHeight = Math.max(maxHeight, childDim.height);
  });

  if (childFiles.length > 0) {
    totalWidth += childFiles.length * SPACING_CONFIG.FILE_TO_FILE_SPACING;
  }

  return {
    width: Math.max(totalWidth, SPACING_CONFIG.MINIMUM_TREE_WIDTH),
    height: maxHeight + SPACING_CONFIG.TREE_HEIGHT_PADDING,
  };
}

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
    centerX,
    topY,
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
        x: centerX - SPACING_CONFIG.FOLDER_NODE_WIDTH / 2,
        y: topY,
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
          name: nodeData.name,
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

      if (parentId) {
        const edgeColor = nodeData.isAppRouter ? "#3b82f6" : "#6b7280";
        edges.push({
          id: `edge-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: "smoothstep",
          style: {
            stroke: edgeColor,
            strokeWidth: nodeData.isAppRouter ? 3 : 2,
          },
        });
      }
    }

    // Process children with configurable spacing
    if (isExpanded && (childFolders.length > 0 || childFiles.length > 0)) {
      const childY = topY + SPACING_CONFIG.PARENT_CHILD_VERTICAL_DISTANCE;

      let totalChildWidth = 0;
      childFolders.forEach((child) => {
        const childPath = `${path}-${child.name}`;
        const childDim = calculateTreeDimensions(
          child,
          childPath,
          expandedNodes,
          level + 1
        );
        totalChildWidth +=
          childDim.width + SPACING_CONFIG.FOLDER_TO_FOLDER_SPACING;
      });
      totalChildWidth +=
        childFiles.length * SPACING_CONFIG.FILE_TO_FILE_SPACING;

      let childX = centerX - totalChildWidth / 2;

      // Process child folders with configurable spacing
      childFolders.forEach((child) => {
        const childPath = `${path}-${child.name}`;
        const childDim = calculateTreeDimensions(
          child,
          childPath,
          expandedNodes,
          level + 1
        );
        const childCenterX = childX + childDim.width / 2;

        processNode(
          child,
          childPath,
          nodeId,
          level + 1,
          childCenterX,
          childY,
          projectRoot
        );
        childX += childDim.width + SPACING_CONFIG.FOLDER_TO_FOLDER_SPACING;
      });

      // Process files with configurable spacing
      childFiles.forEach((file, index) => {
        const fileNodeId = `${nodeId}-file-${index}`;
        const fileX = childX + SPACING_CONFIG.FILE_POSITION_OFFSET;

        const initialPosition = {
          x: fileX - SPACING_CONFIG.FILE_NODE_WIDTH / 2,
          y: childY,
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
            name: file.name,
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

        const edgeColor = file.isAppRouter ? "#10b981" : "#6b7280";
        edges.push({
          id: `edge-${nodeId}-${fileNodeId}`,
          source: nodeId,
          target: fileNodeId,
          type: "smoothstep",
          style: {
            stroke: edgeColor,
            strokeWidth: file.isAppRouter ? 2.5 : 1.5,
          },
        });

        childX += SPACING_CONFIG.FILE_TO_FILE_SPACING;
      });
    }
  }

  const projectRoot = rootData.projectRoot || "";
  processNode(
    rootData,
    "root",
    null,
    0,
    0,
    SPACING_CONFIG.ROOT_START_Y,
    projectRoot
  );

  return { nodes, edges };
}

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

  // Dependency layout with configurable spacing
  const childY = parentPosition.y + SPACING_CONFIG.FILE_DEPENDENCY_DISTANCE;
  const depNodeWidth = SPACING_CONFIG.DEPENDENCY_NODE_WIDTH;
  const horizontalSpacing = SPACING_CONFIG.DEPENDENCY_HORIZONTAL_SPACING;
  const totalChildWidth = allDeps.length * horizontalSpacing;
  let childX = parentPosition.x - totalChildWidth / 2;

  allDeps.forEach((dep, index) => {
    const depX = childX + horizontalSpacing / 2;
    const initialPosition = {
      x: depX - depNodeWidth / 2,
      y: childY,
    };
    const safePosition = findCompactPosition(
      initialPosition,
      [...existingNodes, ...nodes],
      depNodeWidth,
      SPACING_CONFIG.DEPENDENCY_NODE_HEIGHT
    );

    const nodeId = `${parentFileNodeId}-dep-${dep.nodeId || dep.uiId || index}`;
    const dependencyNode = {
      id: nodeId,
      type: "dependency",
      position: safePosition,
      width: depNodeWidth,
      height: SPACING_CONFIG.DEPENDENCY_NODE_HEIGHT,
      data: {
        name: dep.name,
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

    const edgeColor = dep.isLocal ? "#10b981" : "#6366f1";
    const edge = {
      id: `edge-${parentFileNodeId}-${nodeId}`,
      source: parentFileNodeId,
      target: nodeId,
      type: "smoothstep",
      style: {
        stroke: edgeColor,
        strokeWidth: dep.isLocal ? 2.5 : 1.5,
        strokeDasharray: dep.isLocal ? "0" : "5,5",
      },
    };

    edges.push(edge);
    childX += horizontalSpacing;
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

// Export the configuration for external access if needed
export { SPACING_CONFIG };
