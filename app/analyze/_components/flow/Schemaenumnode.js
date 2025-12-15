import { memo } from "react";
import { Database, List } from "lucide-react";
import { Position } from "@xyflow/react";
import {
  ConnectionHandle,
  SchemaNodeContainer,
  SchemaNodeHeader,
  SchemaNodeIcon,
  SchemaNodeBody,
  SchemaFieldRow,
  SchemaFieldName,
  SchemaFieldType,
  SchemaNodeFooter,
  SchemaNodeStats,
  SchemaNodeStat,
  StatusDot,
  FieldWithHandle,
} from "@/components/database-schema-node";

const SchemaNode = memo(({ data }) => {
  const isEnum = data.modelType === "enum";

  const getFieldVariant = (field) => {
    if (field.isRelation) return "relation";
    if (field.isEnum) return "enum";
    if (field.isId) return "primary";
    if (field.isUnique) return "unique";
    return "default";
  };

  // ✅ Fields that need BOTH source and target handles (relations and enums)
  const needsBothHandles = (field) => {
    return field.isRelation || field.isEnum;
  };

  // ✅ Fields that need ONLY a target handle (primary keys, unique fields that can be referenced)
  const needsTargetHandle = (field) => {
    return field.isId || field.isUnique;
  };

  return (
    <SchemaNodeContainer>
      <SchemaNodeHeader variant={isEnum ? "enum" : "model"}>
        <SchemaNodeIcon>
          {isEnum ? (
            <List className="w-3.5 h-3.5" />
          ) : (
            <Database className="w-3.5 h-3.5" />
          )}
        </SchemaNodeIcon>
        <span>{data.label}</span>
      </SchemaNodeHeader>

      <SchemaNodeBody>
        {data.schema.map((field) => (
          <SchemaFieldRow key={field.handleId} variant={getFieldVariant(field)}>
            {needsBothHandles(field) ? (
              // ✅ Relation/Enum fields with BOTH handles
              <FieldWithHandle
                id={field.handleId}
                name={field.title}
                type={field.type}
                variant={getFieldVariant(field)}
              />
            ) : needsTargetHandle(field) ? (
              // ✅ ID/Unique fields with ONLY target handle
              <>
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <ConnectionHandle
                    type="target"
                    position={Position.Left}
                    id={`${field.handleId}-target`}
                    className="flex-shrink-0"
                  />
                  <SchemaFieldName>
                    <span
                      className={
                        field.isId
                          ? "text-amber-200 font-semibold"
                          : field.isUnique
                          ? "text-violet-200 font-medium"
                          : "text-slate-300"
                      }
                    >
                      {field.title}
                    </span>
                  </SchemaFieldName>
                </div>
                <SchemaFieldType>{field.type}</SchemaFieldType>
              </>
            ) : (
              // ✅ Regular fields without any handles
              <>
                <SchemaFieldName>
                  <span className="text-slate-300">{field.title}</span>
                </SchemaFieldName>
                <SchemaFieldType>{field.type}</SchemaFieldType>
              </>
            )}
          </SchemaFieldRow>
        ))}
      </SchemaNodeBody>

      {data.stats && (
        <SchemaNodeFooter>
          <SchemaNodeStats>
            <SchemaNodeStat>
              <StatusDot color="slate" />
              {data.stats.totalFields}{" "}
              {data.stats.totalFields === 1 ? "field" : "fields"}
            </SchemaNodeStat>

            {data.stats.relations > 0 && (
              <SchemaNodeStat variant="primary">
                <StatusDot color="blue" animated />
                {data.stats.relations}{" "}
                {data.stats.relations === 1 ? "relation" : "relations"}
              </SchemaNodeStat>
            )}
          </SchemaNodeStats>
        </SchemaNodeFooter>
      )}
    </SchemaNodeContainer>
  );
});

SchemaNode.displayName = "SchemaNode";

export default SchemaNode;
