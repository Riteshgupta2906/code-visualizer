
const SPACING_CONFIG = {
  // Horizontal Spacing (now represents depth/levels)
  PARENT_CHILD_HORIZONTAL_DISTANCE: 450,
  FOLDER_HORIZONTAL_SPACING: 450,
  FILE_HORIZONTAL_OFFSET: 0,
  DEPENDENCY_HORIZONTAL_DISTANCE: 350,

  // Vertical Spacing (now represents sibling spread)
  FOLDER_TO_FOLDER_SPACING: 50,
  FILE_TO_FILE_SPACING: 120,
  DEPENDENCY_VERTICAL_SPACING: 100,
  TREE_WIDTH_PADDING: 300,

  // Collision Avoidance
  COLLISION_VERTICAL_INCREMENT: 150,
  COLLISION_HORIZONTAL_INCREMENT: 120,
  COLLISION_PADDING: 20,
  COLLISION_MAX_ATTEMPTS: 20,

  // Node Dimensions
  FOLDER_NODE_WIDTH: 260,
  FOLDER_NODE_HEIGHT: 80,
  FILE_NODE_WIDTH: 260,
  FILE_NODE_HEIGHT: 64,
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
 * @param {string} sourceHandle - Optional source handle ID
 * @param {string} targetHandle - Optional target handle ID
 */
function createDataEdge(
  sourceId,
  targetId,
  dataKey = "name",
  isAppRouter = false,
  edgeType = "folder",
  sourceHandle = null,
  targetHandle = null
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
  } else if (edgeType === "dependency-incoming") {
    strokeColor = "#8b5cf6";
    strokeWidth = 2;
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

  if (sourceHandle) edge.sourceHandle = sourceHandle;
  if (targetHandle) edge.targetHandle = targetHandle;

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
  onAnalyzeDependencies,
  dependencyAnalysisResults
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

        // Determine active modes for this file
        const analysisResult = dependencyAnalysisResults?.get(fileNodeId);
        const initialActiveModes = [];
        if (analysisResult?.outgoing) initialActiveModes.push("outgoing");
        if (analysisResult?.incoming) initialActiveModes.push("incoming");

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
            initialActiveModes, // Pass active modes to initialize UI
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
  
  // Explicitly set isLocal and exists flag based on the source array
  const formattedLocalDeps = (localDependencies || []).map((dep) => ({
    ...dep,
    isLocal: true,
    exists: dep.exists,
  }));
  const formattedExternalDeps = (externalDependencies || []).map((dep) => ({
    ...dep,
    isLocal: false,
    exists: true,
  }));

  const allDeps = [...formattedLocalDeps, ...formattedExternalDeps];

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
        edgeType,
        "dependency-out", // Source: File Node Right Handle
        "dependency-in" // Target: Dependency Node Left Handle
      )
    );

    childY += verticalSpacing;
  });

  return { nodes, edges };
}

// Dependencies go FURTHER LEFT and stack VERTICALLY
export function createReverseDependencyNodes(
  dependencies,
  parentFileNodeId,
  parentPosition,
  existingNodes = []
) {
  const nodes = [];
  const edges = [];

  // dependencies is an array of { filePath, relativePath, name }
  if (!dependencies || dependencies.length === 0) {
    return { nodes, edges };
  }

  const childX =
    parentPosition.x + SPACING_CONFIG.DEPENDENCY_HORIZONTAL_DISTANCE;
  const depNodeHeight = SPACING_CONFIG.DEPENDENCY_NODE_HEIGHT;
  const verticalSpacing = SPACING_CONFIG.DEPENDENCY_VERTICAL_SPACING;
  const totalChildHeight = dependencies.length * verticalSpacing;
  let childY = parentPosition.y - totalChildHeight / 2;

  dependencies.forEach((dep, index) => {
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

    const nodeId = `${parentFileNodeId}-rev-dep-${index}`;
    const dependencyNode = {
      id: nodeId,
      type: "dependency", // Reuse dependency node for now, or create a new one if needed
      position: safePosition,
      width: SPACING_CONFIG.DEPENDENCY_NODE_WIDTH,
      height: depNodeHeight,
      data: {
        name: dep.name,
        type: "dependency",
        dependencyInfo: { ...dep, type: "import" }, // Mock info to satisfy component
        isLocal: true, // Usually local files import us
        exists: true,
        resolvedPath: dep.filePath,
        importType: "import",
        nodeId: nodeId,
      },
      draggable: true,
    };

    nodes.push(dependencyNode);

    // Create edge FROM File TO Dependency using createDataEdge
    edges.push(
      createDataEdge(
        parentFileNodeId,
        nodeId,
        "name", // Display 'name' though usually hidden for dependencies if key not found? Or maybe we want name.
        false,
        "dependency-incoming",
        "dependency-out",
        "dependency-in"
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

      // Handle Outgoing Dependencies
      if (depData.outgoing) {
        const { nodes, edges } = createDependencyNodes(
          depData.outgoing,
          fileNodeId,
          fileNode.position,
          allExistingNodes
        );
        dependencyNodes.push(...nodes);
        dependencyEdges.push(...edges);
      }

      // Handle Incoming Dependencies (Reverse)
      if (depData.incoming && depData.incoming.importedBy) {
        // Update existing nodes list with newly added outgoing nodes to avoid collision
        const updatedExistingNodes = [
          ...allExistingNodes,
          ...dependencyNodes.slice(allExistingNodes.length - baseNodes.length), // This logic is a bit flawed, just pass everything
        ];

        const { nodes, edges } = createReverseDependencyNodes(
          depData.incoming.importedBy,
          fileNodeId,
          fileNode.position,
          [...allExistingNodes, ...dependencyNodes]
        );
        dependencyNodes.push(...nodes);
        dependencyEdges.push(...edges);
      }
    }
  });

  return { dependencyNodes, dependencyEdges };
}

export { SPACING_CONFIG };
