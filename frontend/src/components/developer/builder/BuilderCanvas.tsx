"use client";

import { useCallback } from "react";
import { RedoOutlined, UndoOutlined } from "@ant-design/icons";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import { Button, Empty, Space } from "antd";
import { BuilderNodeCard } from "./BuilderNodeCard";
import { useBuilder } from "./builder-context";
import type { NodeType } from "./types";
import { useBuilderStyles } from "./styles";

const nodeTypes = {
  botNode: BuilderNodeCard,
};

interface BuilderCanvasInnerProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function BuilderCanvasInner({ onUndo, onRedo, canUndo, canRedo }: BuilderCanvasInnerProps) {
  const reactFlow = useReactFlow();
  const { styles } = useBuilderStyles();
  const {
    reactFlowNodes,
    reactFlowEdges,
    state,
    onNodesChange,
    onConnect,
    onEdgesChange,
    setSelectedNode,
    setSelectedEdge,
    addNode,
  } = useBuilder();
  const invalidNodeIds = new Set(
    state.validationResults
      .filter((result) => result.severity === "error" && result.relatedNodeId)
      .map((result) => result.relatedNodeId as string),
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData("application/conversa-node") as NodeType;

      if (!nodeType) {
        return;
      }

      addNode(
        nodeType,
        reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      );
    },
    [addNode, reactFlow],
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div className={styles.builderCanvas}>
      <div className={styles.builderCanvasControls}>
        <Space.Compact>
          <Button icon={<UndoOutlined />} onClick={onUndo} disabled={!canUndo} aria-label="Undo" title="Undo">
            Undo
          </Button>
          <Button icon={<RedoOutlined />} onClick={onRedo} disabled={!canRedo} aria-label="Redo" title="Redo">
            Redo
          </Button>
        </Space.Compact>
      </div>

      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onNodeDragStop={(_, node) => {
          const nextNodes = reactFlowNodes.map((candidate) =>
            candidate.id === node.id ? { ...candidate, position: node.position } : candidate,
          );
          onNodesChange(nextNodes);
        }}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onPaneClick={() => {
          setSelectedNode(undefined);
          setSelectedEdge(undefined);
        }}
        onConnect={onConnect}
        onEdgeClick={(_, edge) => setSelectedEdge(edge.id)}
        onEdgesDelete={(edges) => {
          const remainingEdges = reactFlowEdges.filter(
            (edge) => !edges.some((deletedEdge) => deletedEdge.id === edge.id),
          );
          onEdgesChange(remainingEdges);
          setSelectedEdge(undefined);
        }}
        deleteKeyCode={["Backspace", "Delete"]}
        connectionLineStyle={{ stroke: "#0f172a", strokeWidth: 2.2 }}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
          style: { stroke: "#94a3b8", strokeWidth: 2 },
        }}
      >
        <MiniMap
          zoomable
          pannable
          nodeColor={(node) =>
            invalidNodeIds.has(node.id)
              ? "#FCA5A5"
              : "#E5E7EB"
          }
          nodeStrokeColor={(node) =>
            invalidNodeIds.has(node.id)
              ? "#DC2626"
              : "#94A3B8"
          }
          nodeBorderRadius={10}
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 16,
          }}
          maskColor="rgba(17, 24, 39, 0.06)"
        />
        <Controls
          position="bottom-left"
          showInteractive={false}
          style={{ borderRadius: 16, overflow: "hidden" }}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="rgba(107, 114, 128, 0.26)"
        />
      </ReactFlow>

      {reactFlowNodes.length === 0 ? (
        <div className={styles.builderEmptyOverlay}>
          <Empty description="Drop a node here to start building your bot." />
        </div>
      ) : null}
    </div>
  );
}

interface BuilderCanvasProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function BuilderCanvas({ onUndo, onRedo, canUndo, canRedo }: BuilderCanvasProps) {
  return (
    <ReactFlowProvider>
      <BuilderCanvasInner onUndo={onUndo} onRedo={onRedo} canUndo={canUndo} canRedo={canRedo} />
    </ReactFlowProvider>
  );
}
