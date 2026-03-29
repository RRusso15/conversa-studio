"use client";

import { Alert, Button, Card, Empty, Space, Tag, Typography } from "antd";
import { ExclamationCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { useBuilder } from "./builder-context";
import { useBuilderStyles } from "./styles";

const { Paragraph, Text, Title } = Typography;

export function BuilderValidationPanel() {
  const { styles } = useBuilderStyles();
  const {
    state,
    setSelectedEdge,
    setSelectedNode,
  } = useBuilder();

  const issues = state.validationResults;
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;

  return (
    <Card bordered={false} className={styles.validationPanelCard}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Title level={5} style={{ marginBottom: 4 }}>
            Validation
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Structural issues stay visible here so you can fix them without losing context.
          </Paragraph>
          {issues.length > 0 ? (
            <Space wrap style={{ marginTop: 8 }}>
              <Tag color={errorCount > 0 ? "error" : "default"}>{errorCount} error{errorCount === 1 ? "" : "s"}</Tag>
              <Tag color={warningCount > 0 ? "warning" : "default"}>{warningCount} warning{warningCount === 1 ? "" : "s"}</Tag>
            </Space>
          ) : null}
        </div>

        {issues.length === 0 ? (
          <Empty
            description="No validation issues right now."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            {issues.map((issue) => {
              const relatedNode = issue.relatedNodeId
                ? state.graph.nodes.find((node) => node.id === issue.relatedNodeId)
                : undefined;
              const targetLabel = relatedNode
                ? `Node: ${relatedNode.label}`
                : issue.relatedNodeId
                  ? `Node: ${issue.relatedNodeId}`
                : issue.relatedEdgeId
                  ? `Edge: ${issue.relatedEdgeId}`
                  : "General";

              return (
                <Alert
                  key={`${issue.id}-${issue.relatedNodeId ?? ""}-${issue.relatedEdgeId ?? ""}`}
                  type={issue.severity === "error" ? "error" : "warning"}
                  showIcon
                  icon={issue.severity === "error" ? <ExclamationCircleOutlined /> : <WarningOutlined />}
                  message={issue.message}
                  description={
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      <Text type="secondary">{targetLabel}</Text>
                      {(issue.relatedNodeId || issue.relatedEdgeId) ? (
                        <Button
                          size="small"
                          onClick={() => {
                            if (issue.relatedNodeId) {
                              setSelectedEdge(undefined);
                              setSelectedNode(issue.relatedNodeId);
                              return;
                            }

                            if (issue.relatedEdgeId) {
                              setSelectedNode(undefined);
                              setSelectedEdge(issue.relatedEdgeId);
                            }
                          }}
                        >
                          Jump to issue
                        </Button>
                      ) : null}
                    </Space>
                  }
                  action={<Tag color={issue.severity === "error" ? "error" : "warning"}>{issue.severity}</Tag>}
                />
              );
            })}
          </Space>
        )}
      </Space>
    </Card>
  );
}
