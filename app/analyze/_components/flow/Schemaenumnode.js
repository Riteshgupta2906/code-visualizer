import { memo } from "react";
import { Database, Key, Star, Tag, Link, List } from "lucide-react";
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

  const getFieldIcon = (field) => {
    if (field.isId) return <Key className="w-3 h-3 text-amber-400" />;
    if (field.isUnique) return <Star className="w-3 h-3 text-amber-300" />;
    if (field.isEnum) return <Tag className="w-3 h-3 text-purple-400" />;
    if (field.isRelation) return <Link className="w-3 h-3 text-blue-400" />;
    return null;
  };

  const getFieldVariant = (field) => {
    if (field.isRelation) return "relation";
    if (field.isEnum) return "enum";
    if (field.isId) return "primary";
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
                icon={getFieldIcon(field)}
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
                  <SchemaFieldName icon={getFieldIcon(field)}>
                    <span
                      className={
                        field.isId
                          ? "text-amber-300 font-semibold"
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
                <SchemaFieldName icon={getFieldIcon(field)}>
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
