export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getDMMF } from "@prisma/internals";
import dagre from "dagre";
import fs from "fs/promises";

export async function POST(request) {
  try {
    const { schemaPath } = await request.json();

    if (!schemaPath) {
      return NextResponse.json(
        { error: "Schema path is required" },
        { status: 400 }
      );
    }

    // Read schema file
    const schemaContent = await fs.readFile(schemaPath, "utf-8");

    // Parse schema using Prisma internals
    const dmmf = await getDMMF({ datamodel: schemaContent });

    // Transform to graph nodes and edges
    const { nodes, edges } = transformToGraph(dmmf.datamodel);

    // Apply layout
    const layoutedNodes = applyDagreLayout(nodes, edges);

    // Calculate comprehensive statistics
    const stats = calculateComprehensiveStats(dmmf.datamodel, nodes, edges);

    return NextResponse.json({
      nodes: layoutedNodes,
      edges,
      dmmf,
      fileName: schemaPath.split("/").pop(),
      stats,
    });
  } catch (error) {
    console.error("Schema analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze schema" },
      { status: 500 }
    );
  }
}

/**
 * Calculate comprehensive database schema statistics
 */
function calculateComprehensiveStats(datamodel, nodes, edges) {
  const models = datamodel.models;
  const enums = datamodel.enums;

  // Basic counts
  const modelCount = models.length;
  const enumCount = enums.length;

  // Relation statistics
  const relationEdges = edges.filter((e) => e.data?.type === "relation");
  const enumReferenceEdges = edges.filter(
    (e) => e.data?.type === "enumReference"
  );

  const oneToOneRelations = relationEdges.filter(
    (e) => e.data?.relationType === "one-to-one"
  ).length;
  const oneToManyRelations = relationEdges.filter(
    (e) => e.data?.relationType === "one-to-many"
  ).length;
  const manyToManyRelations = relationEdges.filter(
    (e) => e.data?.relationType === "many-to-many"
  ).length;

  // ⭐ Model-wise breakdown (KEY ADDITION)
  const modelBreakdown = models
    .map((model) => {
      const relationFields = model.fields.filter((f) => f.kind === "object");
      const relatedModels = relationFields.map((f) => f.type);

      return {
        name: model.name,
        dbName: model.dbName || model.name,
        relations: relationFields.length,
        fields: model.fields.length,
        indexes:
          (model.indexes?.length || 0) + (model.uniqueIndexes?.length || 0),
        relatedModels: relatedModels,
        // Additional details
        scalarFields: model.fields.filter((f) => f.kind === "scalar").length,
        enumFields: model.fields.filter((f) => f.kind === "enum").length,
        uniqueFields: model.fields.filter((f) => f.isUnique).length,
        requiredFields: model.fields.filter((f) => f.isRequired).length,
        fieldsWithDefaults: model.fields.filter((f) => f.hasDefaultValue)
          .length,
        // Relation types for this model
        relationTypes: {
          oneToOne: 0,
          oneToMany: 0,
          manyToMany: 0,
        },
      };
    })
    .sort((a, b) => b.relations - a.relations); // Sort by relation count (most connected first)

  // Calculate relation types per model
  relationEdges.forEach((edge) => {
    const sourceModelName = edge.source.replace("model-", "");
    const modelData = modelBreakdown.find((m) => m.name === sourceModelName);

    if (modelData && edge.data?.relationType) {
      if (edge.data.relationType === "one-to-one") {
        modelData.relationTypes.oneToOne++;
      } else if (edge.data.relationType === "one-to-many") {
        modelData.relationTypes.oneToMany++;
      } else if (edge.data.relationType === "many-to-many") {
        modelData.relationTypes.manyToMany++;
      }
    }
  });

  // Index statistics
  let totalIndexes = 0;
  let totalUniqueIndexes = 0;

  models.forEach((model) => {
    const regularIndexes = model.indexes?.length || 0;
    const uniqueIndexes = model.uniqueIndexes?.length || 0;

    totalIndexes += regularIndexes;
    totalUniqueIndexes += uniqueIndexes;
  });

  // Enum statistics
  const totalEnumValues = enums.reduce(
    (sum, enumDef) => sum + enumDef.values.length,
    0
  );
  const enumsUsedInModels = new Set(
    models.flatMap((model) =>
      model.fields.filter((f) => f.kind === "enum").map((f) => f.type)
    )
  ).size;

  // Calculate averages
  const totalRelations = modelBreakdown.reduce(
    (sum, m) => sum + m.relations,
    0
  );
  const averageRelationsPerModel =
    modelCount > 0 ? (totalRelations / modelCount).toFixed(2) : 0;

  return {
    // Overview (Essential stats)
    overview: {
      modelCount,
      enumCount,
      totalRelations: relationEdges.length,
      totalIndexes: totalIndexes + totalUniqueIndexes,
    },

    // ⭐ Model-wise breakdown (MOST IMPORTANT)
    modelBreakdown,

    // Relations breakdown
    relations: {
      total: relationEdges.length,
      oneToOne: oneToOneRelations,
      oneToMany: oneToManyRelations,
      manyToMany: manyToManyRelations,
      enumReferences: enumReferenceEdges.length,
      averagePerModel: parseFloat(averageRelationsPerModel),
    },

    // Indexes breakdown
    indexes: {
      total: totalIndexes + totalUniqueIndexes,
      regular: totalIndexes,
      unique: totalUniqueIndexes,
    },

    // Enums
    enums: {
      total: enumCount,
      totalValues: totalEnumValues,
      usedInModels: enumsUsedInModels,
      averageValuesPerEnum:
        enumCount > 0 ? (totalEnumValues / enumCount).toFixed(2) : 0,
    },

    // Insights (Quick summary)
    insights: {
      mostConnectedModel: modelBreakdown[0] || null,
      leastConnectedModel: modelBreakdown[modelBreakdown.length - 1] || null,
      averageRelationsPerModel: parseFloat(averageRelationsPerModel),
      totalModelsWithRelations: modelBreakdown.filter((m) => m.relations > 0)
        .length,
    },
  };
}

/**
 * Transform DMMF datamodel to ReactFlow nodes and edges
 */
function transformToGraph(datamodel) {
  const nodes = [];
  const edges = [];
  const processedRelations = new Set();

  // Create model nodes
  datamodel.models.forEach((model) => {
    const node = createModelNode(model);
    nodes.push(node);
  });

  // Create enum nodes
  datamodel.enums.forEach((enumDef) => {
    const node = createEnumNode(enumDef);
    nodes.push(node);
  });

  // Create edges from relations
  datamodel.models.forEach((model) => {
    model.fields.forEach((field) => {
      // Handle relation fields (connections between tables)
      if (field.kind === "object") {
        const edge = createRelationEdge(
          model,
          field,
          datamodel.models,
          processedRelations
        );
        if (edge) edges.push(edge);
      }

      // Handle enum references
      if (field.kind === "enum") {
        const edge = createEnumEdge(model, field);
        if (edge) edges.push(edge);
      }
    });
  });

  return { nodes, edges };
}

/**
 * Create a model node (table visualization)
 */
function createModelNode(model) {
  const schema = model.fields.map((field) => {
    const fieldType = formatFieldType(field);
    const constraints = getFieldConstraints(field);

    return {
      title: field.name,
      type: fieldType,
      constraints: constraints,
      isId: field.isId,
      isUnique: field.isUnique,
      isRequired: field.isRequired,
      isRelation: field.kind === "object",
      isEnum: field.kind === "enum",
      isList: field.isList,
      handleId: `${model.name}.${field.name}`,
      // Additional metadata for table visualization
      dbName: field.dbName || field.name,
      hasDefaultValue: field.hasDefaultValue,
      default: field.default,
    };
  });

  // Extract model-level constraints
  const modelConstraints = getModelConstraints(model);

  const stats = {
    totalFields: model.fields.length,
    relations: model.fields.filter((f) => f.kind === "object").length,
    indexes: (model.uniqueIndexes?.length || 0) + (model.indexes?.length || 0),
    constraints: modelConstraints.length,
  };

  return {
    id: `model-${model.name}`,
    type: "databaseSchema",
    position: { x: 0, y: 0 },
    data: {
      label: model.name,
      dbName: model.dbName || model.name,
      schema,
      stats,
      modelType: "model",
      constraints: modelConstraints,
      primaryKey: model.primaryKey,
      uniqueIndexes: model.uniqueIndexes || [],
      indexes: model.indexes || [],
    },
  };
}

/**
 * Create an enum node
 */
function createEnumNode(enumDef) {
  const schema = enumDef.values.map((value) => ({
    title: value.name,
    type: "enum value",
    handleId: `${enumDef.name}.${value.name}`,
    dbName: value.dbName || value.name,
    isEnum: true, // ✅ Added flag
  }));

  // ✅ Add a generic target handle entry for the enum itself
  schema.unshift({
    title: enumDef.name,
    type: "enum type",
    handleId: `${enumDef.name}.${enumDef.name}`,
    dbName: enumDef.dbName || enumDef.name,
    isEnum: true,
    isEnumRoot: true, // ✅ Flag to identify this as the main enum handle
  });

  return {
    id: `enum-${enumDef.name}`,
    type: "databaseSchema",
    position: { x: 0, y: 0 },
    data: {
      label: enumDef.name,
      dbName: enumDef.dbName || enumDef.name,
      schema,
      stats: {
        totalFields: enumDef.values.length,
      },
      modelType: "enum",
    },
  };
}

/**
 * Get field-level constraints for display
 */
function getFieldConstraints(field) {
  const constraints = [];

  if (field.isId) {
    constraints.push("PRIMARY KEY");
  }

  if (field.isUnique) {
    constraints.push("UNIQUE");
  }

  if (field.isRequired && field.kind === "scalar") {
    constraints.push("NOT NULL");
  }

  if (field.hasDefaultValue) {
    const defaultValue = formatDefaultValue(field.default);
    constraints.push(`DEFAULT ${defaultValue}`);
  }

  // Add foreign key constraint info
  if (field.kind === "object" && field.relationFromFields?.length > 0) {
    const fkFields = field.relationFromFields.join(", ");
    const refFields = field.relationToFields?.join(", ") || "id";
    constraints.push(`FK (${fkFields}) → ${field.type}(${refFields})`);
  }

  if (field.isUpdatedAt) {
    constraints.push("AUTO UPDATE");
  }

  return constraints;
}

/**
 * Get model-level constraints
 */
function getModelConstraints(model) {
  const constraints = [];

  // Composite primary key
  if (model.primaryKey && model.primaryKey.fields.length > 1) {
    constraints.push({
      type: "PRIMARY KEY",
      fields: model.primaryKey.fields,
      name: model.primaryKey.name,
    });
  }

  // Composite unique constraints
  if (model.uniqueIndexes) {
    model.uniqueIndexes.forEach((index) => {
      constraints.push({
        type: "UNIQUE",
        fields: index.fields,
        name: index.name,
      });
    });
  }

  // Regular indexes
  if (model.indexes) {
    model.indexes.forEach((index) => {
      constraints.push({
        type: "INDEX",
        fields: index.fields,
        name: index.name,
      });
    });
  }

  return constraints;
}

/**
 * Format field type with modifiers
 */
function formatFieldType(field) {
  let type = field.type;

  // Add array marker
  if (field.isList) {
    type += "[]";
  }

  // Add optional marker (only for scalar types)
  if (!field.isRequired && field.kind === "scalar") {
    type += "?";
  }

  return type;
}

/**
 * Format default value for display
 */
function formatDefaultValue(defaultValue) {
  if (!defaultValue) return "";

  if (typeof defaultValue === "object") {
    // Handle function defaults like now(), uuid(), autoincrement()
    if (defaultValue.name) {
      return `${defaultValue.name}()`;
    }
    if (defaultValue.args) {
      return JSON.stringify(defaultValue);
    }
  }

  if (typeof defaultValue === "string") {
    return `"${defaultValue}"`;
  }

  return String(defaultValue);
}

/**
 * Determine the type of relation (one-to-one, one-to-many, many-to-many)
 */
function determineRelationType(sourceModel, sourceField, targetModel) {
  const sourceIsList = sourceField.isList;

  // Find the reverse relation field in target model
  let targetIsList = false;
  if (targetModel) {
    const reverseField = targetModel.fields.find(
      (f) =>
        f.kind === "object" &&
        f.type === sourceModel.name &&
        f.relationName === sourceField.relationName
    );
    targetIsList = reverseField?.isList || false;
  }

  // Determine relation type
  if (sourceIsList && targetIsList) {
    return "many-to-many";
  } else if (sourceIsList || targetIsList) {
    return "one-to-many";
  } else {
    return "one-to-one";
  }
}

/**
 * Get foreign key information from field
 */
function getForeignKeyInfo(field) {
  if (!field.relationFromFields || field.relationFromFields.length === 0) {
    return null;
  }

  return {
    fromFields: field.relationFromFields,
    toFields: field.relationToFields || ["id"],
    onDelete: field.relationOnDelete,
    onUpdate: field.relationOnUpdate,
  };
}

/**
 * Create descriptive edge label
 */
function createEdgeLabel(field, relationType, foreignKeyInfo) {
  const parts = [];

  // Add relation type symbol
  const relationSymbol = {
    "one-to-one": "1:1",
    "one-to-many": "1:N",
    "many-to-many": "N:N",
  };
  parts.push(relationSymbol[relationType] || "");

  // Add relation name if exists
  if (field.relationName) {
    parts.push(field.relationName);
  }

  // Add FK info if available
  if (foreignKeyInfo) {
    const fkLabel = `${foreignKeyInfo.fromFields.join(
      ","
    )} → ${foreignKeyInfo.toFields.join(",")}`;
    parts.push(fkLabel);
  }

  return parts.filter(Boolean).join(" | ");
}

/**
 * Create relation edge between tables
 */
function createRelationEdge(model, field, allModels, processedRelations) {
  // Create a unique key for this relation to avoid duplicates
  // Use relationName if available, otherwise sort model names
  const relationKey = field.relationName
    ? field.relationName
    : [model.name, field.type].sort().join("-");

  // Skip if we've already processed this relation
  if (processedRelations.has(relationKey)) {
    return null;
  }
  processedRelations.add(relationKey);

  const sourceModelId = `model-${model.name}`;
  const targetModelId = `model-${field.type}`;

  // ✅ UPDATED: Determine source handle with proper format
  // Format: ModelName.fieldName-source
  const sourceHandle = `${model.name}.${field.name}-source`;

  // ✅ UPDATED: Find the primary key or first field of target model for handle
  const targetModel = allModels.find((m) => m.name === field.type);
  const targetPrimaryKey = targetModel?.fields.find((f) => f.isId);

  // Format: TargetModelName.primaryKeyField-target
  const targetHandle = targetPrimaryKey
    ? `${field.type}.${targetPrimaryKey.name}-target`
    : `${field.type}.id-target`; // ✅ Changed fallback to include field name

  // Determine relation type by checking both sides
  const relationType = determineRelationType(model, field, targetModel);

  // Get foreign key information
  const foreignKeyInfo = getForeignKeyInfo(field);

  // Create edge label
  const edgeLabel = createEdgeLabel(field, relationType, foreignKeyInfo);

  return {
    id: `relation-${model.name}-${field.name}-${field.type}`,
    source: sourceModelId,
    target: targetModelId,
    sourceHandle, // ✅ Now matches: ModelName.fieldName-source
    targetHandle, // ✅ Now matches: TargetModel.idField-target
    type: "smoothstep",
    animated: false,
    style: {
      stroke: "#3b82f6",
      strokeWidth: 2,
    },
    label: edgeLabel,
    labelStyle: {
      fill: "#e5e7eb", // ✅ Changed to lighter color for dark background
      fontSize: 11,
      fontWeight: 500,
    },
    labelBgStyle: {
      fill: "#1f2937", // ✅ Changed to dark background
      fillOpacity: 0.9,
    },
    labelBgPadding: [8, 4], // ✅ Added padding for better label visibility
    labelBgBorderRadius: 4, // ✅ Added border radius
    data: {
      type: "relation",
      relationType,
      relationName: field.relationName,
      foreignKeyFields: field.relationFromFields || [],
      referencedFields: field.relationToFields || [],
      onDelete: field.relationOnDelete,
      onUpdate: field.relationOnUpdate,
    },
  };
}

/**
 * Create enum reference edge
 */
function createEnumEdge(model, field) {
  const sourceModelId = `model-${model.name}`;
  const targetEnumId = `enum-${field.type}`;

  // ✅ UPDATED: Add proper handle suffixes
  const sourceHandle = `${model.name}.${field.name}-source`;
  const targetHandle = `${field.type}.${field.type}-target`; // ✅ For enum nodes, we need a specific target

  return {
    id: `enum-ref-${model.name}-${field.name}-${field.type}`,
    source: sourceModelId,
    target: targetEnumId,
    sourceHandle,
    targetHandle,
    type: "smoothstep",
    animated: false,
    style: {
      stroke: "#8b5cf6",
      strokeWidth: 2,
      strokeDasharray: "5,5",
    },
    label: "uses",
    labelStyle: {
      fill: "#c4b5fd", // ✅ Changed to lighter purple for dark background
      fontSize: 10,
      fontWeight: 500,
    },
    labelBgStyle: {
      fill: "#1f2937", // ✅ Changed to dark background
      fillOpacity: 0.9,
    },
    labelBgPadding: [6, 4], // ✅ Added padding
    labelBgBorderRadius: 4, // ✅ Added border radius
    data: {
      type: "enumReference",
    },
  };
}

/**
 * Apply Dagre layout
 */
function applyDagreLayout(nodes, edges) {
  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "LR", // Left to right
    ranksep: 250, // Spacing between ranks
    nodesep: 150, // Spacing between nodes
    edgesep: 50, // Spacing for edges
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    const fieldCount = node.data.schema.length;
    const constraintCount = node.data.constraints?.length || 0;

    // Calculate dynamic height based on content
    const baseHeight = 80;
    const fieldHeight = fieldCount * 36;
    const constraintHeight = constraintCount * 24;

    const width = 320;
    const height = Math.max(180, baseHeight + fieldHeight + constraintHeight);

    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    };
  });
}
