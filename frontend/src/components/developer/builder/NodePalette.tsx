"use client";

import { Button, Card, Space, Typography } from "antd";
import { useBuilder } from "./builder-context";
import { nodePalette } from "./node-registry";
import { useBuilderStyles } from "./styles";

const { Paragraph, Title } = Typography;

export function NodePalette() {
  const { styles } = useBuilderStyles();
  const { addNode } = useBuilder();

  return (
    <Card bordered={false} className={styles.panelCard}>
      <Title level={5}>Nodes</Title>
      <Paragraph type="secondary">
        Click to add a node instantly, or drag it into a specific spot on the canvas.
      </Paragraph>

      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        {nodePalette.map((node) => (
          <Button
            key={node.type}
            className={styles.paletteButton}
            size="large"
            icon={node.icon}
            onClick={() => addNode(node.type)}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/conversa-node", node.type);
              event.dataTransfer.effectAllowed = "move";
            }}
          >
            <span>{node.label}</span>
          </Button>
        ))}
      </Space>
    </Card>
  );
}
