"use client";

import type { CSSProperties } from "react";
import { Handle, Position } from "reactflow";
import { CopyOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { Dropdown, Space, Tag, Typography } from "antd";
import { useBuilderStyles } from "./styles";
import type {
  ConditionNodeConfig,
  NodeConfig,
  NodeDefinition,
  NodeType,
} from "./types";
import { useBuilder } from "./builder-context";
import { conditionOperatorRequiresValue } from "./variable-utils";

const { Text } = Typography;

interface BuilderNodeCardProps {
  data: {
    nodeId: string;
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
  const { duplicateNode, deleteNode, setSelectedNode } = useBuilder();
  const isCondition = data.nodeType === "condition";
  const conditionConfig =
    data.config.kind === "condition" ? data.config : undefined;

  const conditionPaths = getConditionPaths(conditionConfig);

  return (
    <Dropdown
      trigger={["contextMenu"]}
      menu={{
        items: [
          {
            key: "duplicate",
            icon: <CopyOutlined />,
            label: "Duplicate node",
          },
          {
            key: "delete",
            icon: <DeleteOutlined />,
            label: "Delete node",
            danger: true,
            disabled: data.nodeType === "start",
          },
        ],
        onClick: ({ key }) => {
          setSelectedNode(data.nodeId);

          if (key === "duplicate") {
            duplicateNode(data.nodeId);
          }

          if (key === "delete") {
            deleteNode(data.nodeId);
          }
        },
      }}
    >
      <div
        className={styles.flowNode}
        data-selected={data.isSelected}
        data-node-type={data.nodeType}
        onContextMenu={() => setSelectedNode(data.nodeId)}
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
            <MoreOutlined className={styles.flowNodeMenuIcon} />
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
    </Dropdown>
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
    rule: conditionOperatorRequiresValue(rule.operator)
      ? `${conditionConfig.variableName || "variable"} ${rule.operator} ${rule.value.trim() || "value"}`.trim()
      : `${conditionConfig.variableName || "variable"} ${rule.operator}`.trim(),
  }));

  return [
    ...rulePaths,
    {
      id: "fallback",
      label: conditionConfig.fallbackLabel.trim() || "Fallback",
      rule: "Default path when no rule matches the selected variable",
    },
  ];
}
