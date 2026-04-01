"use client";

import { DeleteOutlined, ExpandOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import {
  App,
  Alert,
  AutoComplete,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { useRef, useState, type ChangeEvent } from "react";
import { useBuilder } from "./builder-context";
import { useBotActions, useBotState } from "@/providers/botProvider";
import {
  addBotAiPdfSource,
  addBotAiTextSource,
  addBotAiUrlSource,
  deleteBotAiSource,
  reingestBotAiSource,
  upsertBotAiSettings,
} from "@/utils/ai-knowledge-api";
import type { ConditionRule } from "./types";
import { nodeRegistry } from "./node-registry";
import { useBuilderStyles } from "./styles";
import {
  collectGraphVariables,
  conditionOperatorRequiresValue,
  createQuestionChoiceOption,
  getQuestionChoiceHandleId,
  getVariableOperation,
} from "./variable-utils";

const { Paragraph, Text, Title } = Typography;

interface BuilderPropertiesPanelProps {
  compact?: boolean;
}

export function BuilderPropertiesPanel({
  compact = false,
}: BuilderPropertiesPanelProps) {
  const { styles } = useBuilderStyles();
  const { notification } = App.useApp();
  const [isCodeEditorModalOpen, setIsCodeEditorModalOpen] = useState(false);
  const [isAiKnowledgeModalOpen, setIsAiKnowledgeModalOpen] = useState(false);
  const [aiApiKeyDraft, setAiApiKeyDraft] = useState("");
  const [aiGenerationModelDraft, setAiGenerationModelDraft] = useState("gemini-2.5-flash");
  const [aiEmbeddingModelDraft, setAiEmbeddingModelDraft] = useState("gemini-embedding-001");
  const [aiTextTitleDraft, setAiTextTitleDraft] = useState("");
  const [aiTextDraft, setAiTextDraft] = useState("");
  const [aiUrlTitleDraft, setAiUrlTitleDraft] = useState("");
  const [aiUrlDraft, setAiUrlDraft] = useState("");
  const [isAiSaving, setIsAiSaving] = useState(false);
  const expandEditorButtonRef = useRef<HTMLButtonElement | null>(null);
  const aiFileInputRef = useRef<HTMLInputElement | null>(null);
  const { activeBot, draftIdentity } = useBotState();
  const { getBot } = useBotActions();
  const {
    selectedNode,
    selectedEdge,
    updateNodeConfig,
    updateNodeLabel,
    deleteSelectedNode,
    deleteSelectedEdge,
    replaceEdges,
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
            {selectedEdge.source} to {selectedEdge.target}
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
  const availableVariables = collectGraphVariables(state.graph);
  const variableOptions = availableVariables.map((variableName) => ({
    value: variableName,
  }));
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
  const activeAiKnowledge = activeBot?.aiKnowledge;
  const isPersistedBot = draftIdentity === "persisted" && Boolean(activeBot?.id);
  const aiReadySources = activeAiKnowledge?.readySourceCount ?? 0;
  const aiSourceCount = activeAiKnowledge?.sourceCount ?? 0;

  const openAiKnowledgeModal = () => {
    setAiApiKeyDraft("");
    setAiGenerationModelDraft(activeAiKnowledge?.generationModel || "gemini-2.5-flash");
    setAiEmbeddingModelDraft(activeAiKnowledge?.embeddingModel || "gemini-embedding-001");
    setIsAiKnowledgeModalOpen(true);
  };

  const refreshActiveBot = async () => {
    if (!activeBot?.id) {
      return;
    }

    await getBot(activeBot.id);
  };

  const handleSaveAiSettings = async () => {
    if (!activeBot?.id) {
      return;
    }

    setIsAiSaving(true);
    try {
      await upsertBotAiSettings({
        botId: activeBot.id,
        apiKey: aiApiKeyDraft,
        generationModel: aiGenerationModelDraft,
        embeddingModel: aiEmbeddingModelDraft,
      });
      await refreshActiveBot();
      setAiApiKeyDraft("");
      notification.success({
        message: "AI settings saved",
        description: "Gemini settings were updated for this bot.",
      });
    } catch (error) {
      notification.error({
        message: "AI settings failed",
        description: error instanceof Error ? error.message : "The AI settings could not be saved.",
      });
    } finally {
      setIsAiSaving(false);
    }
  };

  const handleAddAiTextSource = async () => {
    if (!activeBot?.id) {
      return;
    }

    setIsAiSaving(true);
    try {
      await addBotAiTextSource({
        botId: activeBot.id,
        title: aiTextTitleDraft,
        text: aiTextDraft,
      });
      await refreshActiveBot();
      setAiTextTitleDraft("");
      setAiTextDraft("");
      notification.success({
        message: "Text knowledge added",
        description: "The pasted text was ingested for this bot.",
      });
    } catch (error) {
      notification.error({
        message: "Text knowledge failed",
        description: error instanceof Error ? error.message : "The text source could not be added.",
      });
    } finally {
      setIsAiSaving(false);
    }
  };

  const handleAddAiUrlSource = async () => {
    if (!activeBot?.id) {
      return;
    }

    setIsAiSaving(true);
    try {
      await addBotAiUrlSource({
        botId: activeBot.id,
        title: aiUrlTitleDraft,
        url: aiUrlDraft,
      });
      await refreshActiveBot();
      setAiUrlTitleDraft("");
      setAiUrlDraft("");
      notification.success({
        message: "Website knowledge added",
        description: "The page snapshot was ingested for this bot.",
      });
    } catch (error) {
      notification.error({
        message: "Website knowledge failed",
        description: error instanceof Error ? error.message : "The URL source could not be added.",
      });
    } finally {
      setIsAiSaving(false);
    }
  };

  const handleAiPdfSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeBot?.id) {
      return;
    }

    setIsAiSaving(true);
    try {
      const base64Content = await readFileAsBase64(file);
      await addBotAiPdfSource({
        botId: activeBot.id,
        title: file.name,
        fileName: file.name,
        base64Content,
      });
      await refreshActiveBot();
      notification.success({
        message: "PDF knowledge added",
        description: `${file.name} was ingested for this bot.`,
      });
    } catch (error) {
      notification.error({
        message: "PDF knowledge failed",
        description: error instanceof Error ? error.message : "The PDF source could not be added.",
      });
    } finally {
      event.target.value = "";
      setIsAiSaving(false);
    }
  };

  const handleReingestAiSource = async (sourceId: string) => {
    if (!activeBot?.id) {
      return;
    }

    setIsAiSaving(true);
    try {
      await reingestBotAiSource(activeBot.id, sourceId);
      await refreshActiveBot();
      notification.success({
        message: "Knowledge refreshed",
        description: "The selected knowledge source was re-ingested.",
      });
    } catch (error) {
      notification.error({
        message: "Refresh failed",
        description: error instanceof Error ? error.message : "The knowledge source could not be refreshed.",
      });
    } finally {
      setIsAiSaving(false);
    }
  };

  const handleDeleteAiSource = async (sourceId: string) => {
    if (!activeBot?.id) {
      return;
    }

    setIsAiSaving(true);
    try {
      await deleteBotAiSource(activeBot.id, sourceId);
      await refreshActiveBot();
      notification.success({
        message: "Knowledge removed",
        description: "The selected knowledge source was removed.",
      });
    } catch (error) {
      notification.error({
        message: "Delete failed",
        description: error instanceof Error ? error.message : "The knowledge source could not be removed.",
      });
    } finally {
      setIsAiSaving(false);
    }
  };

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
            <>
              <Form.Item label="Message Text">
                <div className={styles.composerShell}>
                  <div className={styles.composerHeader}>
                    <Text strong>Response Composer</Text>
                    <Tag className={styles.polishedPanelTag}>User-facing</Tag>
                  </div>
                  <div className={styles.composerBody}>
                    <div className={styles.subtleTextarea}>
                      <Input.TextArea
                        rows={4}
                        value={messageConfig.message}
                        placeholder="Write the message the bot should send at this step."
                        onChange={(event) =>
                          updateNodeConfig(selectedNode.id, {
                            ...messageConfig,
                            message: event.target.value,
                          })
                        }
                      />
                    </div>
                    <Text className={styles.sectionNote}>
                      Keep this short and direct. Use variables if the message should reflect earlier answers.
                    </Text>
                  </div>
                </div>
              </Form.Item>
              <VariableHints availableVariables={availableVariables} />
            </>
          ) : null}

          {questionConfig ? (
            <>
              <Form.Item label="Question Prompt">
                <div className={styles.composerShell}>
                  <div className={styles.composerHeader}>
                    <Text strong>Prompt Composer</Text>
                    <Tag className={styles.polishedPanelTag}>
                      {(questionConfig.inputMode ?? "text") === "choice" ? "Choice Question" : "Open Text"}
                    </Tag>
                  </div>
                  <div className={styles.composerBody}>
                    <div className={styles.subtleTextarea}>
                      <Input.TextArea
                        rows={4}
                        value={questionConfig.question}
                        placeholder="Ask the user for the information this node needs."
                        onChange={(event) =>
                          updateNodeConfig(selectedNode.id, {
                            ...questionConfig,
                            question: event.target.value,
                          })
                        }
                      />
                    </div>
                    <Text className={styles.sectionNote}>
                      Phrase this exactly as it should appear in the conversation.
                    </Text>
                  </div>
                </div>
              </Form.Item>
              <Form.Item label="Capture Variable">
                <div className={styles.compactEditorCard}>
                  <Text className={styles.fieldLabel}>Saved As</Text>
                  <AutoComplete
                    value={questionConfig.variableName}
                    options={variableOptions}
                    placeholder="customerName"
                    onChange={(value) =>
                      updateNodeConfig(selectedNode.id, {
                        ...questionConfig,
                        variableName: value,
                      })
                    }
                  />
                </div>
              </Form.Item>
              <Form.Item label="Input Type">
                <div className={styles.compactEditorCard}>
                  <Text className={styles.fieldLabel}>Capture Mode</Text>
                  <Select
                    value={questionConfig.inputMode ?? "text"}
                    options={[
                      { label: "Open text", value: "text" },
                      { label: "Button choices", value: "choice" },
                    ]}
                    onChange={(value: "text" | "choice") =>
                      (() => {
                        if (value === "text") {
                          replaceEdges(
                            state.graph.edges.filter(
                              (edge) =>
                                edge.source !== selectedNode.id ||
                                (!edge.sourceHandle?.startsWith("option-") && edge.sourceHandle !== "invalid"),
                            ),
                          );
                        }

                        updateNodeConfig(selectedNode.id, {
                          ...questionConfig,
                          inputMode: value,
                          options: value === "choice"
                            ? ((questionConfig.options ?? []).length > 0
                                ? (questionConfig.options ?? [])
                                : [createQuestionChoiceOption(1)])
                            : [],
                        });
                      })()
                    }
                  />
                </div>
              </Form.Item>
              {(questionConfig.inputMode ?? "text") === "choice" ? (
                <>
                  <Form.Item label="Button Options">
                    <div className={styles.compactCardList}>
                      {(questionConfig.options ?? []).map((option, index) => (
                        <div key={option.id} className={`${styles.compactEditorCard} ${styles.compactEditorCardAccent}`}>
                          <div className={styles.compactCardHeader}>
                            <div>
                              <Text className={styles.compactCardTitle}>Choice {index + 1}</Text>
                              <Text className={styles.compactCardSubtitle}>
                                This option matches one visible branch handle on the node.
                              </Text>
                            </div>
                            <Button
                              danger
                              icon={<MinusCircleOutlined />}
                              onClick={() => {
                                replaceEdges(
                                  state.graph.edges.filter(
                                    (edge) =>
                                      edge.source !== selectedNode.id ||
                                      edge.sourceHandle !== getQuestionChoiceHandleId(option.id),
                                  ),
                                );

                                updateNodeConfig(selectedNode.id, {
                                  ...questionConfig,
                                  options: (questionConfig.options ?? []).filter((_, optionIndex) => optionIndex !== index),
                                });
                              }}
                            />
                          </div>
                          <div className={styles.inlineFieldGrid}>
                            <div>
                              <Text className={styles.fieldLabel}>Button Label</Text>
                              <Input
                                value={option.label}
                                placeholder={`Option ${index + 1} label`}
                                onChange={(event) => {
                                  const nextOptions = [...(questionConfig.options ?? [])];
                                  nextOptions[index] = { ...option, label: event.target.value };

                                  updateNodeConfig(selectedNode.id, {
                                    ...questionConfig,
                                    options: nextOptions,
                                  });
                                }}
                              />
                            </div>
                            <div>
                              <Text className={styles.fieldLabel}>Stored Value</Text>
                              <Input
                                value={option.value ?? ""}
                                placeholder="Defaults to the label if left blank"
                                onChange={(event) => {
                                  const nextOptions = [...(questionConfig.options ?? [])];
                                  nextOptions[index] = { ...option, value: event.target.value };

                                  updateNodeConfig(selectedNode.id, {
                                    ...questionConfig,
                                    options: nextOptions,
                                  });
                                }}
                              />
                            </div>
                            <Text className={styles.compactCardSubtitle}>
                              Handle: {option.label.trim() || `Option ${index + 1}`}
                            </Text>
                          </div>
                        </div>
                      ))}
                      <Button
                        icon={<PlusOutlined />}
                        onClick={() =>
                          updateNodeConfig(selectedNode.id, {
                            ...questionConfig,
                            options: [
                              ...(questionConfig.options ?? []),
                              createQuestionChoiceOption((questionConfig.options ?? []).length + 1),
                            ],
                          })
                        }
                      >
                        Add Option
                      </Button>
                    </div>
                  </Form.Item>
                  <Form.Item label="Invalid Input Message">
                    <div className={styles.reservedNotice}>
                      <Text className={styles.compactCardTitle}>Reserved invalid-input response</Text>
                      <Text className={styles.compactCardSubtitle}>
                        Typed input that does not match a choice stays on this node and sends this message.
                      </Text>
                      <div className={styles.subtleTextarea} style={{ marginTop: 12 }}>
                        <Input.TextArea
                          rows={3}
                          value={questionConfig.invalidInputMessage ?? ""}
                          onChange={(event) =>
                            updateNodeConfig(selectedNode.id, {
                              ...questionConfig,
                              invalidInputMessage: event.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </Form.Item>
                </>
              ) : null}
              <VariableHints availableVariables={availableVariables} />
            </>
          ) : null}

          {conditionConfig ? (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Form.Item label="Source Variable" required>
                <div className={styles.compactEditorCardWarm}>
                  <Text className={styles.fieldLabel}>Decision Variable</Text>
                  <AutoComplete
                    value={conditionConfig.variableName}
                    options={variableOptions}
                    placeholder="userIntent"
                    onChange={(value) =>
                      updateNodeConfig(selectedNode.id, {
                        ...conditionConfig,
                        variableName: value,
                      })
                    }
                  />
                </div>
              </Form.Item>

              {availableVariables.length === 0 ? (
                <Alert
                  type="info"
                  showIcon
                  message="Variables required"
                  description="Create or capture a variable first using Question or Variable nodes."
                />
              ) : null}

              <Form.Item label="Condition Paths">
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <Text type="secondary">Rules are evaluated top to bottom.</Text>
                  {conditionConfig.rules.map((rule, index) => (
                    <div key={rule.id} className={`${styles.compactEditorCard} ${styles.compactEditorCardWarm}`}>
                      <div className={styles.compactCardHeader}>
                        <div>
                          <Text className={styles.compactCardTitle}>Rule {index + 1}</Text>
                          <Text className={styles.compactCardSubtitle}>
                            Evaluated in order before the fallback path.
                          </Text>
                        </div>
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => removeRule(index)}
                        />
                      </div>
                      <div className={styles.inlineFieldGrid}>
                        <div>
                          <Text className={styles.fieldLabel}>Operator</Text>
                          <Select
                            value={rule.operator}
                            options={[
                              { label: "Equals", value: "equals" },
                              { label: "Contains", value: "contains" },
                              { label: "Starts with", value: "startsWith" },
                              { label: "Ends with", value: "endsWith" },
                              { label: "Is empty", value: "isEmpty" },
                              { label: "Is not empty", value: "isNotEmpty" },
                            ]}
                            onChange={(value) => updateRule(index, { operator: value })}
                          />
                        </div>
                        <div>
                          <Text className={styles.fieldLabel}>Comparison</Text>
                          {conditionOperatorRequiresValue(rule.operator) ? (
                            <Input
                              value={rule.value}
                              placeholder="Value to compare against"
                              onChange={(event) => updateRule(index, { value: event.target.value })}
                            />
                          ) : (
                            <div className={styles.reservedNotice}>
                              <Text className={styles.sectionNote}>
                                This operator does not require a comparison value.
                              </Text>
                            </div>
                          )}
                        </div>
                        <Text className={styles.compactCardSubtitle}>
                          {`${conditionConfig.variableName || "selectedVariable"} ${rule.operator} ${conditionOperatorRequiresValue(rule.operator) ? rule.value || "value" : ""}`.trim()}
                        </Text>
                      </div>
                    </div>
                  ))}
                  <Button icon={<PlusOutlined />} onClick={addRule}>
                    Add Rule
                  </Button>
                </Space>
              </Form.Item>

              <Form.Item label="Fallback Label">
                <div className={styles.reservedNotice}>
                  <Text className={styles.compactCardTitle}>Fallback Path</Text>
                  <Text className={styles.compactCardSubtitle}>
                    Used when none of the rules match the selected variable.
                  </Text>
                  <Input
                    value={conditionConfig.fallbackLabel}
                    style={{ marginTop: 12 }}
                    onChange={(event) =>
                      updateNodeConfig(selectedNode.id, {
                        ...conditionConfig,
                        fallbackLabel: event.target.value,
                      })
                    }
                  />
                </div>
              </Form.Item>
            </Space>
          ) : null}

          {variableConfig ? (
            <>
              <Form.Item label="Variable Name">
                <div className={styles.compactEditorCardPurple}>
                  <Text className={styles.fieldLabel}>Target Variable</Text>
                  <AutoComplete
                    value={variableConfig.variableName}
                    options={variableOptions}
                    placeholder="customerName"
                    onChange={(value) =>
                      updateNodeConfig(selectedNode.id, {
                        ...variableConfig,
                        variableName: value,
                      })
                    }
                  />
                </div>
              </Form.Item>
              <Form.Item label="Operation">
                <div className={styles.compactEditorCardPurple}>
                  <Text className={styles.fieldLabel}>Operation Mode</Text>
                  <Select
                    value={getVariableOperation(variableConfig)}
                    options={[
                      { label: "Set", value: "set" },
                      { label: "Append", value: "append" },
                      { label: "Clear", value: "clear" },
                      { label: "Copy from variable", value: "copy" },
                    ]}
                    onChange={(value) =>
                      updateNodeConfig(selectedNode.id, {
                        ...variableConfig,
                        operation: value,
                      })
                    }
                  />
                  <Text className={styles.sectionNote} style={{ marginTop: 10 }}>
                    {getVariableOperation(variableConfig) === "append"
                      ? "Add new text onto the current value."
                      : getVariableOperation(variableConfig) === "copy"
                        ? "Mirror another saved variable into this one."
                        : getVariableOperation(variableConfig) === "clear"
                          ? "Reset this variable to an empty value."
                          : "Overwrite the variable with a new value."}
                  </Text>
                </div>
              </Form.Item>
              {getVariableOperation(variableConfig) === "copy" ? (
                <Form.Item label="Source Variable">
                  <div className={styles.compactEditorCardPurple}>
                    <Text className={styles.fieldLabel}>Copy From</Text>
                    <AutoComplete
                      value={variableConfig.sourceVariableName}
                      options={variableOptions.filter((option) => option.value !== variableConfig.variableName)}
                      placeholder="customerName"
                      onChange={(value) =>
                        updateNodeConfig(selectedNode.id, {
                          ...variableConfig,
                          sourceVariableName: value,
                        })
                      }
                    />
                  </div>
                </Form.Item>
              ) : null}
              {getVariableOperation(variableConfig) !== "clear" && getVariableOperation(variableConfig) !== "copy" ? (
                <Form.Item label="Assigned Value">
                  <div className={styles.compactEditorCardPurple}>
                    <Text className={styles.fieldLabel}>
                      {getVariableOperation(variableConfig) === "append" ? "Appended Text" : "Assigned Value"}
                    </Text>
                    <Input
                      value={variableConfig.value}
                      onChange={(event) =>
                        updateNodeConfig(selectedNode.id, {
                          ...variableConfig,
                          value: event.target.value,
                        })
                      }
                    />
                  </div>
                </Form.Item>
              ) : null}
              <VariableHints availableVariables={availableVariables} />
            </>
          ) : null}

          {apiConfig ? (
            <>
              <Form.Item label="API Request">
                <div className={styles.polishedPanelShell}>
                  <div className={styles.polishedPanelHeader}>
                    <div className={styles.polishedPanelTitle}>
                      <span>Integration Request</span>
                    </div>
                    <div className={styles.polishedPanelHeaderTags}>
                      <Tag className={styles.polishedPanelTag}>{apiConfig.method}</Tag>
                      <Tag className={styles.polishedPanelTag}>Timeout {apiConfig.timeoutMs ?? 10000}ms</Tag>
                      <Tag className={styles.polishedPanelTag}>Runtime Only</Tag>
                    </div>
                  </div>
                  <div className={styles.polishedPanelBody}>
                    <div className={styles.compactCardList}>
                      <div className={`${styles.compactEditorCard} ${styles.compactEditorCardAccent}`}>
                        <div className={styles.compactCardHeader}>
                          <div>
                            <Text className={styles.compactCardTitle}>Request Setup</Text>
                            <Text className={styles.compactCardSubtitle}>
                              Define the method, timeout, and endpoint the runtime should call.
                            </Text>
                          </div>
                        </div>
                        <div className={styles.inlineFieldGridTwo}>
                          <div>
                            <Text className={styles.fieldLabel}>Method</Text>
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
                          </div>
                          <div>
                            <Text className={styles.fieldLabel}>Timeout (ms)</Text>
                            <Input
                              value={String(apiConfig.timeoutMs ?? 10000)}
                              onChange={(event) =>
                                updateNodeConfig(selectedNode.id, {
                                  ...apiConfig,
                                  timeoutMs: Number(event.target.value) || 10000,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <Text className={styles.fieldLabel}>Endpoint</Text>
                          <Input
                            value={apiConfig.endpoint}
                            placeholder="https://api.example.com/orders/{orderId}"
                            onChange={(event) =>
                              updateNodeConfig(selectedNode.id, {
                                ...apiConfig,
                                endpoint: event.target.value,
                              })
                            }
                          />
                          <Text className={styles.sectionNote} style={{ marginTop: 10 }}>
                            Example endpoint: `https://api.example.com/orders/{'{orderId}'}`. Use variable placeholders in the URL, headers, and body template.
                          </Text>
                        </div>
                      </div>
                      <div className={styles.compactEditorCard}>
                        <div className={styles.compactCardHeader}>
                          <div>
                            <Text className={styles.compactCardTitle}>Request Headers</Text>
                            <Text className={styles.compactCardSubtitle}>
                              Add only the headers this request needs, such as authorization or content type.
                            </Text>
                          </div>
                        </div>
                        <div className={styles.compactCardList}>
                          {(apiConfig.headers ?? []).map((header, index) => (
                            <div key={header.id} className={styles.compactEditorCard}>
                              <div className={styles.compactCardHeader}>
                                <div>
                                  <Text className={styles.compactCardTitle}>Header {index + 1}</Text>
                                  <Text className={styles.compactCardSubtitle}>
                                    Variables can be used in header values.
                                  </Text>
                                </div>
                                <Button
                                  danger
                                  icon={<MinusCircleOutlined />}
                                  onClick={() =>
                                    updateNodeConfig(selectedNode.id, {
                                      ...apiConfig,
                                      headers: (apiConfig.headers ?? []).filter((_, headerIndex) => headerIndex !== index),
                                    })
                                  }
                                />
                              </div>
                              <div className={styles.inlineFieldGridTwo}>
                                <div>
                                  <Text className={styles.fieldLabel}>Name</Text>
                                  <Input
                                    value={header.key}
                                    placeholder="Authorization"
                                    onChange={(event) => {
                                      const nextHeaders = [...(apiConfig.headers ?? [])];
                                      nextHeaders[index] = { ...header, key: event.target.value };

                                      updateNodeConfig(selectedNode.id, {
                                        ...apiConfig,
                                        headers: nextHeaders,
                                      });
                                    }}
                                  />
                                </div>
                                <div>
                                  <Text className={styles.fieldLabel}>Value</Text>
                                  <Input
                                    value={header.value}
                                    placeholder="Bearer {token}"
                                    onChange={(event) => {
                                      const nextHeaders = [...(apiConfig.headers ?? [])];
                                      nextHeaders[index] = { ...header, value: event.target.value };

                                      updateNodeConfig(selectedNode.id, {
                                        ...apiConfig,
                                        headers: nextHeaders,
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button
                            icon={<PlusOutlined />}
                            onClick={() =>
                              updateNodeConfig(selectedNode.id, {
                                ...apiConfig,
                                headers: [
                                  ...(apiConfig.headers ?? []),
                                  {
                                    id: `header-${(apiConfig.headers ?? []).length + 1}`,
                                    key: "",
                                    value: "",
                                  },
                                ],
                              })
                            }
                          >
                            Add Header
                          </Button>
                        </div>
                      </div>
                      {apiConfig.method === "POST" ? (
                        <div className={styles.compactEditorCard}>
                          <div className={styles.compactCardHeader}>
                            <div>
                              <Text className={styles.compactCardTitle}>Request Body</Text>
                              <Text className={styles.compactCardSubtitle}>
                                Send a JSON payload and interpolate values from earlier steps.
                              </Text>
                            </div>
                          </div>
                          <div className={styles.subtleTextarea}>
                            <Input.TextArea
                              rows={4}
                              value={apiConfig.body}
                              placeholder={'{"orderId":"{orderId}"}'}
                              onChange={(event) =>
                                updateNodeConfig(selectedNode.id, {
                                  ...apiConfig,
                                  body: event.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      ) : null}
                      <div className={styles.compactEditorCard}>
                        <div className={styles.compactCardHeader}>
                          <div>
                            <Text className={styles.compactCardTitle}>Response Mapping</Text>
                            <Text className={styles.compactCardSubtitle}>
                              Choose which response values should be stored into builder variables.
                            </Text>
                          </div>
                        </div>
                        <div className={styles.compactCardList}>
                          {(apiConfig.responseMappings ?? []).map((mapping, index) => (
                            <div key={mapping.id} className={styles.compactEditorCard}>
                              <div className={styles.compactCardHeader}>
                                <div>
                                  <Text className={styles.compactCardTitle}>Mapping {index + 1}</Text>
                                  <Text className={styles.compactCardSubtitle}>
                                    Example path: `data.status` or `body` for the full raw response.
                                  </Text>
                                </div>
                                <Button
                                  danger
                                  icon={<MinusCircleOutlined />}
                                  onClick={() =>
                                    updateNodeConfig(selectedNode.id, {
                                      ...apiConfig,
                                      responseMappings: (apiConfig.responseMappings ?? []).filter((_, mappingIndex) => mappingIndex !== index),
                                    })
                                  }
                                />
                              </div>
                              <div className={styles.inlineFieldGridTwo}>
                                <div>
                                  <Text className={styles.fieldLabel}>Variable</Text>
                                  <AutoComplete
                                    value={mapping.variableName}
                                    options={variableOptions}
                                    placeholder="apiResult"
                                    onChange={(value) => {
                                      const nextMappings = [...(apiConfig.responseMappings ?? [])];
                                      nextMappings[index] = { ...mapping, variableName: value };

                                      updateNodeConfig(selectedNode.id, {
                                        ...apiConfig,
                                        responseMappings: nextMappings,
                                      });
                                    }}
                                  />
                                </div>
                                <div>
                                  <Text className={styles.fieldLabel}>Path</Text>
                                  <Input
                                    value={mapping.path}
                                    placeholder="body or data.id"
                                    onChange={(event) => {
                                      const nextMappings = [...(apiConfig.responseMappings ?? [])];
                                      nextMappings[index] = { ...mapping, path: event.target.value };

                                      updateNodeConfig(selectedNode.id, {
                                        ...apiConfig,
                                        responseMappings: nextMappings,
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button
                            icon={<PlusOutlined />}
                            onClick={() =>
                              updateNodeConfig(selectedNode.id, {
                                ...apiConfig,
                                responseMappings: [
                                  ...(apiConfig.responseMappings ?? []),
                                  {
                                    id: `mapping-${(apiConfig.responseMappings ?? []).length + 1}`,
                                    variableName: "",
                                    path: "body",
                                  },
                                ],
                              })
                            }
                          >
                            Add Mapping
                          </Button>
                        </div>
                      </div>
                      <div className={styles.compactCardList}>
                        <div className={`${styles.compactEditorCard} ${styles.compactEditorCardAccent}`}>
                          <div className={styles.compactCardHeader}>
                            <div>
                              <Text className={styles.compactCardTitle}>Success Path</Text>
                              <Text className={styles.compactCardSubtitle}>
                                The branch used when the request completes successfully.
                              </Text>
                            </div>
                            <Tag className={styles.polishedPanelTag}>Success</Tag>
                          </div>
                          <Text className={styles.fieldLabel}>Route Label</Text>
                          <Input
                            value={apiConfig.successLabel}
                            onChange={(event) =>
                              updateNodeConfig(selectedNode.id, {
                                ...apiConfig,
                                successLabel: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div className={`${styles.compactEditorCard} ${styles.compactEditorCardDanger}`}>
                          <div className={styles.compactCardHeader}>
                            <div>
                              <Text className={styles.compactCardTitle}>Error Path</Text>
                              <Text className={styles.compactCardSubtitle}>
                                The branch used when the request fails or times out.
                              </Text>
                            </div>
                            <Tag className={styles.polishedPanelTag}>Error</Tag>
                          </div>
                          <Text className={styles.fieldLabel}>Route Label</Text>
                          <Input
                            value={apiConfig.errorLabel}
                            onChange={(event) =>
                              updateNodeConfig(selectedNode.id, {
                                ...apiConfig,
                                errorLabel: event.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Form.Item>
              <VariableHints availableVariables={availableVariables} />
            </>
          ) : null}

          {aiConfig ? (
            <>
              <Form.Item label="Response Mode">
                <div className={`${styles.compactEditorCard} ${styles.compactEditorCardWarm}`}>
                  <div className={styles.compactCardHeader}>
                    <div>
                      <Text className={styles.compactCardTitle}>Knowledge Behavior</Text>
                      <Text className={styles.compactCardSubtitle}>
                        Decide how closely this node should stay grounded in the shared knowledge hub.
                      </Text>
                    </div>
                    <Tag className={styles.polishedPanelTag}>
                      {(aiConfig.responseMode ?? "strict").toUpperCase()}
                    </Tag>
                  </div>
                  <Select
                    value={aiConfig.responseMode ?? "strict"}
                    options={[
                      {
                        value: "strict",
                        label: "Strict",
                      },
                      {
                        value: "hybrid",
                        label: "Hybrid",
                      },
                      {
                        value: "free",
                        label: "Free",
                      },
                    ]}
                    onChange={(value) =>
                      updateNodeConfig(selectedNode.id, {
                        ...aiConfig,
                        responseMode: value,
                      })
                    }
                  />
                  <Text className={styles.compactCardSubtitle} style={{ marginTop: 10 }}>
                    {aiConfig.responseMode === "free"
                      ? "Uses the knowledge hub as context, but allows broader model reasoning."
                      : aiConfig.responseMode === "hybrid"
                        ? "Prefers the knowledge hub first, then fills gaps with model reasoning."
                        : "Answers only from indexed knowledge and falls back when grounding is weak."}
                  </Text>
                </div>
              </Form.Item>
              <Form.Item label="Instructions">
                <div className={styles.composerShell}>
                  <div className={styles.composerHeader}>
                    <Text strong>AI Prompt</Text>
                    <Tag className={styles.polishedPanelTag}>Knowledge Grounded</Tag>
                  </div>
                  <div className={styles.composerBody}>
                    <div className={styles.subtleTextarea}>
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
                    </div>
                  </div>
                </div>
              </Form.Item>
              <Form.Item label="Knowledge Hub">
                <div className={styles.polishedPanelShell}>
                  <div className={styles.polishedPanelHeader}>
                    <div className={styles.polishedPanelTitle}>
                      <span>Shared Knowledge</span>
                    </div>
                    <div className={styles.polishedPanelHeaderTags}>
                      <Tag className={styles.polishedPanelTag}>
                        {activeAiKnowledge?.hasApiKey ? "API Key Added" : "API Key Missing"}
                      </Tag>
                      <Tag className={styles.polishedPanelTag}>
                        {aiReadySources}/{aiSourceCount} Ready Sources
                      </Tag>
                      <Tag className={styles.polishedPanelTag}>
                        {activeAiKnowledge?.provider || "Gemini"}
                      </Tag>
                    </div>
                  </div>
                  <div className={styles.polishedPanelBody}>
                    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                      <Alert
                        type={
                          !isPersistedBot
                            ? "warning"
                            : activeAiKnowledge?.isKnowledgeConfigured
                              ? "success"
                              : "warning"
                        }
                        showIcon
                        message={
                          !isPersistedBot
                            ? "Save this bot first"
                            : activeAiKnowledge?.isKnowledgeConfigured
                              ? "Knowledge hub is ready"
                              : "Knowledge hub needs setup"
                        }
                        description={
                          !isPersistedBot
                            ? "This bot needs to exist in the backend before you can store shared AI settings and sources."
                            : activeAiKnowledge?.isKnowledgeConfigured
                              ? "This bot has a Gemini key and at least one ready knowledge source."
                              : "Add a Gemini API key and at least one ready knowledge source before publishing AI nodes."
                        }
                      />
                      <div className={styles.compactCardList}>
                        <div className={`${styles.compactEditorCard} ${styles.compactEditorCardAccent}`}>
                          <div className={styles.compactCardHeader}>
                            <div>
                              <Text className={styles.compactCardTitle}>Runtime Provider</Text>
                              <Text className={styles.compactCardSubtitle}>
                                Gemini handles both embeddings and grounded generation for this bot.
                              </Text>
                            </div>
                            <Tag className={styles.polishedPanelTag}>
                              {activeAiKnowledge?.generationModel || "gemini-2.5-flash"}
                            </Tag>
                          </div>
                          <Text className={styles.sectionNote}>
                            Embeddings: {activeAiKnowledge?.embeddingModel || "gemini-embedding-001"}
                          </Text>
                        </div>
                        <div className={`${styles.compactEditorCard} ${styles.compactEditorCardPurple}`}>
                          <div className={styles.compactCardHeader}>
                            <div>
                              <Text className={styles.compactCardTitle}>Indexed Sources</Text>
                              <Text className={styles.compactCardSubtitle}>
                                Pasted text, PDFs, and single-page website snapshots all feed the same bot-level hub.
                              </Text>
                            </div>
                            <Tag className={styles.polishedPanelTag}>{aiSourceCount} Total</Tag>
                          </div>
                          <Text className={styles.sectionNote}>
                            Ready sources are available to every AI node in this bot.
                          </Text>
                        </div>
                      </div>
                      <Button
                        type="primary"
                        onClick={openAiKnowledgeModal}
                        disabled={!isPersistedBot}
                      >
                        Add Knowledge
                      </Button>
                    </Space>
                  </div>
                </div>
              </Form.Item>
              <Form.Item label="Fallback Text">
                <div className={styles.compactEditorCard}>
                  <Text className={styles.fieldLabel}>Fallback Message</Text>
                  <div className={styles.subtleTextarea}>
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
                  </div>
                </div>
              </Form.Item>
              <VariableHints availableVariables={availableVariables} />

              <Modal
                centered
                open={isAiKnowledgeModalOpen}
                onCancel={() => setIsAiKnowledgeModalOpen(false)}
                footer={null}
                width={920}
                destroyOnHidden={false}
              >
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <div>
                    <Title level={4} style={{ marginBottom: 4 }}>
                      Shared AI Knowledge
                    </Title>
                    <Text type="secondary">
                      Configure Gemini and manage the bot-level knowledge hub used by every AI node in this bot.
                    </Text>
                  </div>

                  {!isPersistedBot ? (
                    <Alert
                      type="warning"
                      showIcon
                      message="Save this bot before adding knowledge"
                      description="The shared AI knowledge hub is stored against a persisted bot record, so this draft needs its first save before the hub can be configured."
                    />
                  ) : (
                    <>
                      <div className={styles.compactCardList}>
                        <div className={`${styles.compactEditorCard} ${styles.compactEditorCardAccent}`}>
                          <div className={styles.compactCardHeader}>
                            <div>
                              <Text className={styles.compactCardTitle}>Gemini Settings</Text>
                              <Text className={styles.compactCardSubtitle}>
                                Store the bot-level API key and choose the default generation and embedding models.
                              </Text>
                            </div>
                            <Tag className={styles.polishedPanelTag}>Bot Scoped</Tag>
                          </div>
                          <div className={styles.inlineFieldGrid}>
                            <div>
                              <Text className={styles.fieldLabel}>API Key</Text>
                              <Input.Password
                                value={aiApiKeyDraft}
                                placeholder={activeAiKnowledge?.hasApiKey ? "Leave blank to keep current key" : "AIza..."}
                                onChange={(event) => setAiApiKeyDraft(event.target.value)}
                              />
                            </div>
                            <div className={styles.inlineFieldGridTwo}>
                              <div>
                                <Text className={styles.fieldLabel}>Generation Model</Text>
                                <Input
                                  value={aiGenerationModelDraft}
                                  onChange={(event) => setAiGenerationModelDraft(event.target.value)}
                                />
                              </div>
                              <div>
                                <Text className={styles.fieldLabel}>Embedding Model</Text>
                                <Input
                                  value={aiEmbeddingModelDraft}
                                  onChange={(event) => setAiEmbeddingModelDraft(event.target.value)}
                                />
                              </div>
                            </div>
                            <Button type="primary" loading={isAiSaving} onClick={handleSaveAiSettings}>
                              Save AI Settings
                            </Button>
                          </div>
                        </div>

                        <div className={`${styles.compactEditorCard} ${styles.compactEditorCardPurple}`}>
                          <div className={styles.compactCardHeader}>
                            <div>
                              <Text className={styles.compactCardTitle}>Add Text Knowledge</Text>
                              <Text className={styles.compactCardSubtitle}>
                                Paste documentation, FAQs, or any plain text you want indexed immediately.
                              </Text>
                            </div>
                            <Tag className={styles.polishedPanelTag}>Text</Tag>
                          </div>
                          <div className={styles.inlineFieldGrid}>
                            <div>
                              <Text className={styles.fieldLabel}>Title</Text>
                              <Input
                                value={aiTextTitleDraft}
                                placeholder="Customer support FAQ"
                                onChange={(event) => setAiTextTitleDraft(event.target.value)}
                              />
                            </div>
                            <div>
                              <Text className={styles.fieldLabel}>Content</Text>
                              <Input.TextArea
                                rows={5}
                                value={aiTextDraft}
                                placeholder="Paste the knowledge text here..."
                                onChange={(event) => setAiTextDraft(event.target.value)}
                              />
                            </div>
                            <Button
                              onClick={handleAddAiTextSource}
                              loading={isAiSaving}
                              disabled={!aiTextDraft.trim()}
                            >
                              Add Text Source
                            </Button>
                          </div>
                        </div>

                        <div className={styles.inlineFieldGridTwo}>
                          <div className={`${styles.compactEditorCard} ${styles.compactEditorCardWarm}`}>
                            <div className={styles.compactCardHeader}>
                              <div>
                                <Text className={styles.compactCardTitle}>Add Web Link</Text>
                                <Text className={styles.compactCardSubtitle}>
                                  Capture a single-page snapshot and index the readable text from that page.
                                </Text>
                              </div>
                              <Tag className={styles.polishedPanelTag}>URL</Tag>
                            </div>
                            <div className={styles.inlineFieldGrid}>
                              <div>
                                <Text className={styles.fieldLabel}>Title</Text>
                                <Input
                                  value={aiUrlTitleDraft}
                                  placeholder="Pricing page"
                                  onChange={(event) => setAiUrlTitleDraft(event.target.value)}
                                />
                              </div>
                              <div>
                                <Text className={styles.fieldLabel}>Web Link</Text>
                                <Input
                                  value={aiUrlDraft}
                                  placeholder="https://example.com/pricing"
                                  onChange={(event) => setAiUrlDraft(event.target.value)}
                                />
                              </div>
                              <Button
                                onClick={handleAddAiUrlSource}
                                loading={isAiSaving}
                                disabled={!aiUrlDraft.trim()}
                              >
                                Add URL Source
                              </Button>
                            </div>
                          </div>

                          <div className={`${styles.compactEditorCard} ${styles.compactEditorCardAccent}`}>
                            <div className={styles.compactCardHeader}>
                              <div>
                                <Text className={styles.compactCardTitle}>Add PDF</Text>
                                <Text className={styles.compactCardSubtitle}>
                                  Upload a PDF, extract its text, and index the extracted content only.
                                </Text>
                              </div>
                              <Tag className={styles.polishedPanelTag}>PDF</Tag>
                            </div>
                            <div className={styles.inlineFieldGrid}>
                              <Text className={styles.sectionNote}>
                                PDFs are processed server-side and only the extracted text is stored in the knowledge hub.
                              </Text>
                              <input
                                ref={aiFileInputRef}
                                type="file"
                                accept="application/pdf"
                                style={{ display: "none" }}
                                onChange={handleAiPdfSelected}
                              />
                              <Button
                                onClick={() => aiFileInputRef.current?.click()}
                                loading={isAiSaving}
                              >
                                Upload PDF
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.polishedPanelShell}>
                        <div className={styles.polishedPanelHeader}>
                          <div className={styles.polishedPanelTitle}>
                            <span>Knowledge Sources</span>
                          </div>
                          <div className={styles.polishedPanelHeaderTags}>
                            <Tag className={styles.polishedPanelTag}>
                              {aiReadySources}/{aiSourceCount} Ready
                            </Tag>
                          </div>
                        </div>
                        <div className={styles.polishedPanelBody}>
                          {activeAiKnowledge?.sources?.length ? (
                            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                              {activeAiKnowledge.sources.map((source) => (
                                <div key={source.id} className={styles.compactEditorCard}>
                                  <div className={styles.compactCardHeader}>
                                    <div>
                                      <Text className={styles.compactCardTitle}>{source.title}</Text>
                                      <Text className={styles.compactCardSubtitle}>
                                        {formatAiSourceType(source.sourceType)} source with {source.chunkCount} chunks.
                                      </Text>
                                    </div>
                                    <Space wrap size={8}>
                                      <Tag className={styles.polishedPanelTag}>
                                        {formatAiSourceStatus(source.status)}
                                      </Tag>
                                      {source.sourceUrl ? (
                                        <Tag className={styles.polishedPanelTag}>{source.sourceUrl}</Tag>
                                      ) : null}
                                      {source.sourceFileName ? (
                                        <Tag className={styles.polishedPanelTag}>{source.sourceFileName}</Tag>
                                      ) : null}
                                    </Space>
                                  </div>
                                  {source.failureReason ? (
                                    <Alert
                                      type="error"
                                      showIcon
                                      message="Ingestion failed"
                                      description={source.failureReason}
                                      style={{ marginBottom: 12 }}
                                    />
                                  ) : null}
                                  <Space wrap>
                                    <Button
                                      onClick={() => handleReingestAiSource(source.id)}
                                      loading={isAiSaving}
                                    >
                                      Re-ingest
                                    </Button>
                                    <Button
                                      danger
                                      onClick={() => handleDeleteAiSource(source.id)}
                                      loading={isAiSaving}
                                    >
                                      Remove
                                    </Button>
                                  </Space>
                                </div>
                              ))}
                            </Space>
                          ) : (
                            <Alert
                              type="info"
                              showIcon
                              message="No knowledge sources yet"
                              description="Add text, a PDF, or a web link above to start building the shared AI hub for this bot."
                            />
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </Space>
              </Modal>
            </>
          ) : null}

          {codeConfig ? (
            <>
              <Form.Item label="JavaScript">
                <div className={styles.codeEditorShell}>
                  <div className={styles.codeEditorHeader}>
                    <div className={styles.codeEditorTitle}>
                      <span className={styles.codeEditorDots}>
                        <span />
                        <span />
                        <span />
                      </span>
                      <span>JavaScript</span>
                    </div>
                    <div className={styles.codeEditorHeaderTags}>
                      <Tag className={styles.codeEditorTag}>
                        Timeout {codeConfig.timeoutMs ?? 1000}ms
                      </Tag>
                      <Tag className={styles.codeEditorTag}>Backend Only</Tag>
                      <Button
                        ref={expandEditorButtonRef}
                        size="small"
                        icon={<ExpandOutlined />}
                        className={styles.codeEditorExpandButton}
                        onClick={() => setIsCodeEditorModalOpen(true)}
                      >
                        Expand editor
                      </Button>
                    </div>
                  </div>
                  <div className={styles.codeEditorBody}>
                    <div className={styles.codeEditorTextarea}>
                      <Input.TextArea
                        rows={10}
                        value={codeConfig.script}
                        placeholder={"vars.customerName = vars.customerName ?? \"\";\nvars.summary = `${vars.customerName} is ready`;"} 
                        onChange={(event) =>
                          updateNodeConfig(selectedNode.id, {
                            ...codeConfig,
                            script: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className={styles.codeEditorHelp}>
                      <Text className={styles.codeEditorHelpText}>
                        Use <Text code>vars.&lt;name&gt;</Text> to read or write variables. The script runs on the backend and follows the <Text code>success</Text> or <Text code>error</Text> branch.
                      </Text>
                      <div className={styles.codeEditorExamples}>
                        <pre className={styles.codeEditorExample}>
{`vars.fullName = \`\${vars.firstName ?? ""} \${vars.lastName ?? ""}\`.trim();`}
                        </pre>
                        <pre className={styles.codeEditorExample}>
{`if (!vars.email) {
  throw new Error("Missing email");
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </Form.Item>
              <Form.Item label="Timeout (ms)">
                <Input
                  value={String(codeConfig.timeoutMs ?? 1000)}
                  onChange={(event) =>
                    updateNodeConfig(selectedNode.id, {
                      ...codeConfig,
                      timeoutMs: Number(event.target.value) || 1000,
                    })
                  }
                />
              </Form.Item>
              <VariableHints availableVariables={availableVariables} />

              <Modal
                centered
                open={isCodeEditorModalOpen}
                onCancel={() => setIsCodeEditorModalOpen(false)}
                footer={null}
                width={960}
                destroyOnHidden={false}
                className={styles.codeEditorModal}
                afterOpenChange={(open) => {
                  if (!open) {
                    expandEditorButtonRef.current?.focus();
                  }
                }}
              >
                <div className={styles.codeEditorShell}>
                  <div className={styles.codeEditorHeader}>
                    <div className={styles.codeEditorTitle}>
                      <span className={styles.codeEditorDots}>
                        <span />
                        <span />
                        <span />
                      </span>
                      <span>JavaScript</span>
                    </div>
                    <div className={styles.codeEditorHeaderTags}>
                      <Tag className={styles.codeEditorTag}>
                        Timeout {codeConfig.timeoutMs ?? 1000}ms
                      </Tag>
                      <Tag className={styles.codeEditorTag}>Backend Only</Tag>
                    </div>
                  </div>
                  <div className={`${styles.codeEditorBody} ${styles.codeEditorBodyExpanded}`}>
                    <div className={`${styles.codeEditorTextarea} ${styles.codeEditorTextareaExpanded}`}>
                      <Input.TextArea
                        rows={18}
                        value={codeConfig.script}
                        placeholder={"vars.customerName = vars.customerName ?? \"\";\nvars.summary = `${vars.customerName} is ready`;"} 
                        onChange={(event) =>
                          updateNodeConfig(selectedNode.id, {
                            ...codeConfig,
                            script: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className={styles.codeEditorHelp}>
                      <Text className={styles.codeEditorHelpText}>
                        Use <Text code>vars.&lt;name&gt;</Text> to read or write variables. The script runs on the backend and follows the <Text code>success</Text> or <Text code>error</Text> branch.
                      </Text>
                      <div className={styles.codeEditorExamples}>
                        <pre className={styles.codeEditorExample}>
{`vars.fullName = \`\${vars.firstName ?? ""} \${vars.lastName ?? ""}\`.trim();`}
                        </pre>
                        <pre className={styles.codeEditorExample}>
{`if (!vars.email) {
  throw new Error("Missing email");
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </Modal>
            </>
          ) : null}

          {handoffConfig ? (
            <Form.Item label="Queue Name">
              <div className={`${styles.compactEditorCard} ${styles.compactEditorCardDanger}`}>
                <div className={styles.compactCardHeader}>
                  <div>
                    <Text className={styles.compactCardTitle}>Escalation Target</Text>
                    <Text className={styles.compactCardSubtitle}>
                      Route the conversation out of the bot and into a human workflow.
                    </Text>
                  </div>
                  <Tag className={styles.polishedPanelTag}>Live Team</Tag>
                </div>
                <Input
                  value={handoffConfig.queueName}
                  onChange={(event) =>
                    updateNodeConfig(selectedNode.id, {
                      ...handoffConfig,
                      queueName: event.target.value,
                    })
                  }
                />
              </div>
            </Form.Item>
          ) : null}

          {endConfig ? (
            <>
              <Form.Item label="Closing Text">
                <div className={styles.composerShell}>
                  <div className={styles.composerHeader}>
                    <Text strong>Closing Message</Text>
                    <Tag className={styles.polishedPanelTag}>Conversation End</Tag>
                  </div>
                  <div className={styles.composerBody}>
                    <div className={styles.subtleTextarea}>
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
                    </div>
                  </div>
                </div>
              </Form.Item>
              <VariableHints availableVariables={availableVariables} />
            </>
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

interface VariableHintsProps {
  availableVariables: string[];
}

function VariableHints({ availableVariables }: VariableHintsProps) {
  if (availableVariables.length === 0) {
    return (
      <Alert
        type="info"
        showIcon
        message="Variables"
        description="Use {variableName} syntax in text fields after you create variables with question or variable nodes."
      />
    );
  }

  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      <Text type="secondary">
        Use {"{variableName}"} syntax in text fields to render saved responses.
      </Text>
      <Space wrap>
        {availableVariables.map((variableName) => (
          <Tag key={variableName}>{`{${variableName}}`}</Tag>
        ))}
      </Space>
    </Space>
  );
}

function formatAiSourceType(sourceType: string) {
  switch (sourceType.toLowerCase()) {
    case "pdf":
      return "PDF";
    case "url":
      return "Web link";
    case "text":
    default:
      return "Text";
  }
}

function formatAiSourceStatus(status: string) {
  switch (status.toLowerCase()) {
    case "ready":
      return "Ready";
    case "processing":
      return "Processing";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("The selected file could not be read."));
        return;
      }

      const base64Content = result.split(",")[1] ?? "";
      if (!base64Content) {
        reject(new Error("The selected file did not produce base64 content."));
        return;
      }

      resolve(base64Content);
    };

    reader.onerror = () => {
      reject(new Error("The selected file could not be read."));
    };

    reader.readAsDataURL(file);
  });
}
