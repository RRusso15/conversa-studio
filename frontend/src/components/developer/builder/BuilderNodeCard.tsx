"use client";

import type { CSSProperties } from "react";
import { Handle, Position } from "reactflow";
import { Tag, Typography } from "antd";
import { useBuilderStyles } from "./styles";
import type { NodeDefinition, NodeType } from "./types";

const { Text } = Typography;

interface BuilderNodeCardProps {
  data: {
    label: string;
    nodeType: NodeType;
    definition: NodeDefinition;
    isSelected: boolean;
  };
}

export function BuilderNodeCard({ data }: BuilderNodeCardProps) {
  const { styles } = useBuilderStyles();
  const isCondition = data.nodeType === "condition";

  return (
    <div
      className={styles.flowNode}
      data-selected={data.isSelected}
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
          <Tag style={{ marginInlineEnd: 0 }}>{data.definition.label}</Tag>
        </div>
      </div>

      <div className={styles.flowNodeBody}>
        <Text type="secondary">{data.definition.description}</Text>
      </div>

      {isCondition ? (
        <>
          <Handle
            id="rule-0"
            type="source"
            position={Position.Bottom}
            className={styles.flowHandleLeft}
          />
          <Handle
            id="fallback"
            type="source"
            position={Position.Bottom}
            className={styles.flowHandleRight}
          />
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} className={styles.flowHandle} />
      )}
    </div>
  );
}
