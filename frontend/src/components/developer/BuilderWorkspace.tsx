"use client";

import { App, Grid } from "antd";
import { BuilderProvider, useBuilder } from "./builder/builder-context";
import { BuilderCanvas } from "./builder/BuilderCanvas";
import { BuilderPropertiesPanel } from "./builder/BuilderPropertiesPanel";
import { BuilderSimulatorDrawer } from "./builder/BuilderSimulatorDrawer";
import { BuilderToolbar } from "./builder/BuilderToolbar";
import { NodePalette } from "./builder/NodePalette";
import { useBuilderStyles } from "./builder/styles";

interface BuilderWorkspaceProps {
  botId?: string;
}

function BuilderWorkspaceContent() {
  const screens = Grid.useBreakpoint();
  const { notification } = App.useApp();
  const { styles } = useBuilderStyles();
  const { state, saveGraph, runValidation, setSimulatorOpen } = useBuilder();

  const handleSave = () => {
    saveGraph();
    notification.success({
      message: "Builder saved locally",
      description: "Your bot graph has been stored in local workspace state.",
    });
  };

  const handleValidate = () => {
    const results = runValidation();
    const errors = results.filter((result) => result.severity === "error").length;

    notification[errors > 0 ? "warning" : "success"]({
      message: errors > 0 ? "Validation found issues" : "Validation passed",
      description:
        errors > 0
          ? `${errors} blocking issue${errors === 1 ? "" : "s"} found in the current graph.`
          : "Your current graph is structurally valid for the MVP rules.",
    });
  };

  return (
    <div className={styles.builderShell}>
      <BuilderToolbar
        botName={state.graph.metadata.name}
        isDirty={state.isDirty}
        validationCount={state.validationResults.length}
        onSave={handleSave}
        onValidate={handleValidate}
        onTest={() => setSimulatorOpen(true)}
      />

      <div className={styles.builderMain}>
        <aside className={styles.builderPanel}>
          <NodePalette />
        </aside>

        <main className={styles.builderCanvasRegion}>
          <BuilderCanvas />
        </main>

        <aside className={styles.builderRightPanel}>
          <BuilderPropertiesPanel compact={!screens.xl} />
        </aside>
      </div>

      <BuilderSimulatorDrawer />
    </div>
  );
}

export function BuilderWorkspace({ botId }: BuilderWorkspaceProps) {
  return (
    <BuilderProvider botId={botId}>
      <BuilderWorkspaceContent />
    </BuilderProvider>
  );
}
