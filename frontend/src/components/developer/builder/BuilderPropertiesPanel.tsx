"use client";

import { DeleteOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { useBuilder } from "./builder-context";
import type { ConditionRule } from "./types";
import { nodeRegistry } from "./node-registry";
import { useBuilderStyles } from "./styles";

const { Paragraph, Text, Title } = Typography;

interface BuilderPropertiesPanelProps {
  compact?: boolean;
}

export function BuilderPropertiesPanel({
  compact = false,
}: BuilderPropertiesPanelProps) {
  const { styles } = useBuilderStyles();
  const {
    selectedNode,
    selectedEdge,
    updateNodeConfig,
    updateNodeLabel,
    deleteSelectedNode,
    deleteSelectedEdge,
    state,
  } = useBuilder();

  if (selectedEdge && !selectedNode) {
    return (
      <Card bordered={false} className={styles.panelCard}>
        <Title level={5}>Edge</Title>
        <Paragraph type="secondary">
          Remove the selected connection if you want to change the flow path.
        </Paragraph>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Text strong>{selectedEdge.label ?? "Flow connection"}</Text>
          <Text type="secondary">
            {selectedEdge.source} → {selectedEdge.target}
          </Text>
          <Button danger icon={<DeleteOutlined />} onClick={deleteSelectedEdge}>
            Remove connection
          </Button>
        </Space>
      </Card>
    );
  }

  if (!selectedNode) {
    return (
      <Card bordered={false} className={styles.panelCard}>
        <Empty
          description="Select a node to edit its properties."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const definition = nodeRegistry[selectedNode.type];
  const validationIssues = state.validationResults.filter(
    (result) => result.relatedNodeId === selectedNode.id,
  );
  const messageConfig = selectedNode.config.kind === "message" ? selectedNode.config : undefined;
  const questionConfig =
    selectedNode.config.kind === "question" ? selectedNode.config : undefined;
  const conditionConfig =
    selectedNode.config.kind === "condition" ? selectedNode.config : undefined;
  const variableConfig =
    selectedNode.config.kind === "variable" ? selectedNode.config : undefined;
  const apiConfig = selectedNode.config.kind === "api" ? selectedNode.config : undefined;
  const aiConfig = selectedNode.config.kind === "ai" ? selectedNode.config : undefined;
  const codeConfig = selectedNode.config.kind === "code" ? selectedNode.config : undefined;
  const handoffConfig =
    selectedNode.config.kind === "handoff" ? selectedNode.config : undefined;
  const endConfig = selectedNode.config.kind === "end" ? selectedNode.config : undefined;

  const updateRule = (index: number, patch: Partial<ConditionRule>) => {
    if (!conditionConfig) {
      return;
    }

    const nextRules = conditionConfig.rules.map((rule, ruleIndex) =>
      ruleIndex === index ? { ...rule, ...patch } : rule,
    );

    updateNodeConfig(selectedNode.id, {
      ...conditionConfig,
      rules: nextRules,
    });
  };

  const removeRule = (index: number) => {
    if (!conditionConfig) {
      return;
    }

    updateNodeConfig(selectedNode.id, {
      ...conditionConfig,
      rules: conditionConfig.rules.filter((_, ruleIndex) => ruleIndex !== index),
    });
  };

  const addRule = () => {
    if (!conditionConfig) {
      return;
    }

    updateNodeConfig(selectedNode.id, {
      ...conditionConfig,
      rules: [
        ...conditionConfig.rules,
        {
          id: `rule-${conditionConfig.rules.length + 1}`,
          source: "intent",
          operator: "equals",
          value: "",
        },
      ],
    });
  };

  return (
    <Card bordered={false} className={styles.panelCard}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Space align="center" size={12}>
            <span className={styles.propertiesIcon}>{definition.icon}</span>
            <div>
              <Title level={5} style={{ margin: 0 }}>
                {definition.label}
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {selectedNode.id}
              </Paragraph>
            </div>
          </Space>
        </div>

        {validationIssues.length > 0 ? (
          <Alert
            type="warning"
            showIcon
            message="Validation notes"
            description={
              <Space direction="vertical" size={4}>
                {validationIssues.map((issue) => (
                  <Text key={issue.id}>{issue.message}</Text>
                ))}
              </Space>
            }
          />
        ) : null}

        <Form layout="vertical" size={compact ? "middle" : "large"}>
          <Form.Item label="Node Label">
            <Input
              value={selectedNode.label}
              onChange={(event) => updateNodeLabel(selectedNode.id, event.target.value)}
            />
          </Form.Item>

          {messageConfig ? (
            <Form.Item label="Message Text">
              <Input.TextArea
                rows={4}
                value={messageConfig.message}
                onChange={(event) =>
                  updateNodeConfig(selectedNode.id, {
                    ...messageConfig,
                    message: event.target.value,
                  })
                }
              />
            </Form.Item>
          ) : null}

          {questionConfig ? (
            <>
              <Form.Item label="Question Prompt">
                <Input.TextArea
                  rows={4}
                  value={questionConfig.question}
                  onChange={(event) =>
                    updateNodeConfig(selectedNode.id, {
                      ...questionConfig,
                      question: event.target.value,
                    })
                  }
                />
              </Form.Item>
              <Form.Item label="Capture Variable">
                <Input
                  value={questionConfig.variableName}
                  onChange={(event) =>
                    updateNodeConfig(selectedNode.id, {
                      ...questionConfig,
                      variableName: event.target.value,
                    })
                  }
                />
              </Form.Item>
            </>
          ) : null}

          {conditionConfig ? (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Form.Item label="Condition Paths">
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  {conditionConfig.rules.map((rule, index) => (
                    <Card
                      key={rule.id}
                      size="small"
                      title={<Tag style={{ marginInlineEnd: 0 }}>Rule {index + 1}</Tag>}
                      extra={
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => removeRule(index)}
                        />
                      }
                    >
                      <Space direction="vertical" size="small" style={{ width: "100%" }}>
                        <Select
                          value={rule.source}
                          options={[
                            { label: "Intent", value: "intent" },
                            { label: "Variable", value: "variable" },
                          ]}
                          onChange={(value) => updateRule(index, { source: value })}
                        />
                        <Select
                          value={rule.operator}
                          options={[
                            { label: "Equals", value: "equals" },
                            { label: "Contains", value: "contains" },
                          ]}
                          onChange={(value) => updateRule(index, { operator: value })}
                        />
                        <Input
                          value={rule.value}
                          placeholder="Value to compare against"
                          onChange={(event) => updateRule(index, { value: event.target.value })}
                        />
                      </Space>
                    </Card>
                  ))}
                  <Button icon={<PlusOutlined />} onClick={addRule}>
                    Add Rule
                  </Button>
                </Space>
              </Form.Item>

              <Form.Item label="Fallback Label">
                <Input
                  value={conditionConfig.fallbackLabel}
                  onChange={(event) =>
                    updateNodeConfig(selectedNode.id, {
                      ...conditionConfig,
                      fallbackLabel: event.target.value,
                    })
                  }
                />
              </Form.Item>
            </Space>
          ) : null}

          {variableConfig ? (
            <>
              <Form.Item label="Variable Name">
                <Input
                  value={variableConfig.variableName}
                  onChange={(event) =>
                    updateNodeConfig(selectedNode.id, {
                      ...variableConfig,
                      variableName: event.target.value,
                    })
                  }
                />
              </Form.Item>
              <Form.Item label="Assigned Value">
                <Input
                  value={variableConfig.value}
                  onChange={(event) =>
                    updateNodeConfig(selectedNode.id, {
                      ...variableConfig,
                      value: event.target.value,
                    })
                  }
                />
              </Form.Item>
            </>
          ) : null}

          {apiConfig ? (
            <>
              <Form.Item label="Endpoint">
                <Input
                  value={apiConfig.endpoint}
                  onChange={(event) =>
                    updateNodeConfig(selectedNode.id, {
                      ...apiConfig,
                      endpoint: event.target.value,
                    })
                  }
                />
              </Form.Item>
              <Form.Item label="Method">
                <Select
                  value={apiConfig.method}
                  options={[
                    { label: "GET", value: "GET" },
                    { label: "POST", value: "POST" },
                  ]}
                  onChange={(value) =>
                    updateNodeConfig(selectedNode.id, {
                      ...apiConfig,
                      method: value,
                    })
                  }
                />
              </Form.Item>
            </>
          ) : null}

          {aiConfig ? (
            <>
              <Form.Item label="Instructions">
                <Input.TextArea
                  rows={4}
                  value={aiConfig.instructions}
                  onChange={(event) =>
                    updateNodeConfig(selectedNode.id, {
                      ...aiConfig,
                      instructions: event.target.value,
                    })
                  }
                />
              </Form.Item>
              <Form.Item label="Fallback Text">
                <Input.TextArea
                  rows={3}
                  value={aiConfig.fallbackText}
                  onChange={(event) =>
                    updateNodeConfig(selectedNode.id, {
                      ...aiConfig,
                      fallbackText: event.target.value,
                    })
                  }
                />
              </Form.Item>
            </>
          ) : null}

          {codeConfig ? (
            <Form.Item label="Code Snippet">
              <Input.TextArea
                rows={5}
                value={codeConfig.snippet}
                onChange={(event) =>
                  updateNodeConfig(selectedNode.id, {
                    ...codeConfig,
                    snippet: event.target.value,
                  })
                }
              />
            </Form.Item>
          ) : null}

          {handoffConfig ? (
            <Form.Item label="Queue Name">
              <Input
                value={handoffConfig.queueName}
                onChange={(event) =>
                  updateNodeConfig(selectedNode.id, {
                    ...handoffConfig,
                    queueName: event.target.value,
                  })
                }
              />
            </Form.Item>
          ) : null}

          {endConfig ? (
            <Form.Item label="Closing Text">
              <Input.TextArea
                rows={3}
                value={endConfig.closingText}
                onChange={(event) =>
                  updateNodeConfig(selectedNode.id, {
                    ...endConfig,
                    closingText: event.target.value,
                  })
                }
              />
            </Form.Item>
          ) : null}
        </Form>

        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={deleteSelectedNode}
          disabled={selectedNode.type === "start"}
        >
          Delete Node
        </Button>
      </Space>
    </Card>
  );
}
