"use client";

import type { CSSProperties } from "react";
import { Handle, Position } from "reactflow";
import { CopyOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { Dropdown, Space, Tag, Typography } from "antd";
import { useBuilderStyles } from "./styles";
import type {
  ApiNodeConfig,
  CodeNodeConfig,
  ConditionNodeConfig,
  NodeConfig,
  NodeDefinition,
  NodeType,
  QuestionNodeConfig,
} from "./types";
import { useBuilder } from "./builder-context";
import { conditionOperatorRequiresValue, getQuestionChoiceHandleId } from "./variable-utils";

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
  const isMultiPath =
    data.nodeType === "condition" ||
    data.nodeType === "api" ||
    (data.nodeType === "question" && data.config.kind === "question" && (data.config.inputMode ?? "text") === "choice") ||
    data.nodeType === "code";
  const conditionConfig =
    data.config.kind === "condition" ? data.config : undefined;
  const apiConfig = data.config.kind === "api" ? data.config : undefined;
  const questionConfig = data.config.kind === "question" ? data.config : undefined;
  const codeConfig = data.config.kind === "code" ? data.config : undefined;

  const branchPaths = getBranchPaths(conditionConfig, apiConfig, questionConfig, codeConfig);

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

      {isMultiPath ? (
        <div className={styles.conditionPaths}>
          {branchPaths.map((path) => (
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

function getApiPaths(apiConfig?: ApiNodeConfig): ConditionPathPreview[] {
  if (!apiConfig) {
    return [];
  }

  return [
    {
      id: "success",
      label: apiConfig.successLabel?.trim() || "Success",
      rule: "Continue here when the API call succeeds",
    },
    {
      id: "error",
      label: apiConfig.errorLabel?.trim() || "Error",
      rule: "Continue here when the API call fails",
    },
  ];
}

function getQuestionPaths(questionConfig?: QuestionNodeConfig): ConditionPathPreview[] {
  if (!questionConfig || (questionConfig.inputMode ?? "text") !== "choice") {
    return [];
  }

  return [
    ...(questionConfig.options ?? []).map((option) => ({
      id: getQuestionChoiceHandleId(option.id),
      label: option.label.trim() || "Option",
      rule: `Store ${option.value?.trim() || option.label.trim() || "value"} and continue through this choice path`,
    })),
    {
      id: "invalid",
      label: "Invalid",
      rule: "Reserved for future invalid-input routing; typed mismatches currently retry this question",
    },
  ];
}

function getCodePaths(codeConfig?: CodeNodeConfig): ConditionPathPreview[] {
  if (!codeConfig) {
    return [];
  }

  return [
    {
      id: "success",
      label: "Success",
      rule: "Continue here when the JavaScript code runs successfully",
    },
    {
      id: "error",
      label: "Error",
      rule: "Continue here when the JavaScript code throws or times out",
    },
  ];
}

function getBranchPaths(
  conditionConfig?: ConditionNodeConfig,
  apiConfig?: ApiNodeConfig,
  questionConfig?: QuestionNodeConfig,
  codeConfig?: CodeNodeConfig,
): ConditionPathPreview[] {
  if (conditionConfig) {
    return getConditionPaths(conditionConfig);
  }

  if (questionConfig) {
    return getQuestionPaths(questionConfig);
  }

  if (codeConfig) {
    return getCodePaths(codeConfig);
  }

  return getApiPaths(apiConfig);
}
