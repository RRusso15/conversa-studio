"use client";

import { useCallback } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import { Empty } from "antd";
import { BuilderNodeCard } from "./BuilderNodeCard";
import { useBuilder } from "./builder-context";
import type { NodeType } from "./types";
import { useBuilderStyles } from "./styles";

const nodeTypes = {
  botNode: BuilderNodeCard,
};

function BuilderCanvasInner() {
  const reactFlow = useReactFlow();
  const { styles } = useBuilderStyles();
  const {
    reactFlowNodes,
    reactFlowEdges,
    onNodesChange,
    onConnect,
    onEdgesChange,
    setSelectedNode,
    setSelectedEdge,
    addNode,
  } = useBuilder();

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
        connectionLineStyle={{ stroke: "#111111", strokeWidth: 2 }}
      >
        <MiniMap
          zoomable
          pannable
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

export function BuilderCanvas() {
  return (
    <ReactFlowProvider>
      <BuilderCanvasInner />
    </ReactFlowProvider>
  );
}
