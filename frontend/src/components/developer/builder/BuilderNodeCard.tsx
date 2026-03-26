"use client";

import type { CSSProperties } from "react";
import { Handle, Position } from "reactflow";
import { Space, Tag, Typography } from "antd";
import { useBuilderStyles } from "./styles";
import type {
  ConditionNodeConfig,
  NodeConfig,
  NodeDefinition,
  NodeType,
} from "./types";

const { Text } = Typography;

interface BuilderNodeCardProps {
  data: {
    label: string;
    nodeType: NodeType;
    definition: NodeDefinition;
    config: NodeConfig;
    summary: string;
    isSelected: boolean;
  };
}

export function BuilderNodeCard({ data }: BuilderNodeCardProps) {
  const { styles } = useBuilderStyles();
  const isCondition = data.nodeType === "condition";
  const conditionConfig =
    data.config.kind === "condition" ? data.config : undefined;

  const conditionPaths = getConditionPaths(conditionConfig);

  return (
    <div
      className={styles.flowNode}
      data-selected={data.isSelected}
      data-node-type={data.nodeType}
      style={
        {
          "--builder-node-accent": data.definition.accentColor,
        } as CSSProperties
      }
    >
      {data.nodeType !== "start" ? (
        <Handle type="target" position={Position.Top} className={styles.flowHandle} />
      ) : null}

      <div className={styles.flowNodeHeader}>
        <span className={styles.flowNodeIcon}>{data.definition.icon}</span>
        <div className={styles.flowNodeTitleBlock}>
          <Text strong>{data.label}</Text>
          <Space size={8} wrap>
            <Tag className={styles.flowNodeTag}>{data.definition.label}</Tag>
            <Text className={styles.flowNodeMeta}>
              {getNodeMetaLabel(data.nodeType)}
            </Text>
          </Space>
        </div>
      </div>

      <div className={styles.flowNodeBody}>
        <Text className={styles.flowNodeSummary}>{data.summary}</Text>
      </div>

      {isCondition ? (
        <div className={styles.conditionPaths}>
          {conditionPaths.map((path) => (
            <div key={path.id} className={styles.conditionPathRow}>
              <div>
                <Text className={styles.conditionPathLabel}>{path.label}</Text>
                <Text className={styles.conditionPathRule}>{path.rule}</Text>
              </div>
              <Handle
                id={path.id}
                type="source"
                position={Position.Right}
                className={styles.conditionPathHandle}
              />
            </div>
          ))}
        </div>
      ) : (
        <Handle type="source" position={Position.Bottom} className={styles.flowHandle} />
      )}
    </div>
  );
}

interface ConditionPathPreview {
  id: string;
  label: string;
  rule: string;
}

function getNodeMetaLabel(nodeType: NodeType) {
  switch (nodeType) {
    case "start":
      return "Entry";
    case "message":
      return "Speak";
    case "question":
      return "Capture";
    case "condition":
      return "Branch";
    case "variable":
      return "Set";
    case "api":
      return "Fetch";
    case "ai":
      return "AI";
    case "code":
      return "Logic";
    case "handoff":
      return "Escalate";
    case "end":
      return "Exit";
    default:
      return "Step";
  }
}

function getConditionPaths(
  conditionConfig?: ConditionNodeConfig,
): ConditionPathPreview[] {
  if (!conditionConfig) {
    return [];
  }

  const rulePaths = conditionConfig.rules.map((rule, index) => ({
    id: `rule-${index}`,
    label: rule.value.trim() || `Rule ${index + 1}`,
    rule: `${rule.source} ${rule.operator} ${rule.value.trim() || "value"}`,
  }));

  return [
    ...rulePaths,
    {
      id: "fallback",
      label: conditionConfig.fallbackLabel.trim() || "Fallback",
      rule: "Default path when no rule matches",
    },
  ];
}
