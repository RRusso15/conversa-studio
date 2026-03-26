"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Grid, Result, Spin } from "antd";
import { BuilderProvider, useBuilder } from "./builder/builder-context";
import { BuilderCanvas } from "./builder/BuilderCanvas";
import { BuilderPropertiesPanel } from "./builder/BuilderPropertiesPanel";
import { BuilderSimulatorDrawer } from "./builder/BuilderSimulatorDrawer";
import { BuilderToolbar } from "./builder/BuilderToolbar";
import { NodePalette } from "./builder/NodePalette";
import { useBuilderStyles } from "./builder/styles";
import { useBotActions, useBotState } from "@/providers/botProvider";
import { validateBotGraph } from "./builder/validation";
import type { ValidationResult } from "./builder/types";

interface BuilderWorkspaceProps {
  botId?: string;
}

interface BuilderWorkspaceContentProps {
  botId?: string;
}

function BuilderWorkspaceContent({ botId }: BuilderWorkspaceContentProps) {
  const screens = Grid.useBreakpoint();
  const { notification } = App.useApp();
  const router = useRouter();
  const { styles } = useBuilderStyles();
  const {
    state,
    runValidation,
    setSimulatorOpen,
    updateBotName,
    setValidationResults,
    markSaved
  } = useBuilder();
  const { activeBot, saveStatus, errorMessage } = useBotState();
  const { createBotDraft, updateBotDraft, validateBotDraft } = useBotActions();
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saveInFlightRef = useRef(false);
  const queuedSaveOriginRef = useRef<"autosave" | "manual" | undefined>(undefined);
  const latestGraphRef = useRef(state.graph);
  const persistedBotIdRef = useRef<string | undefined>(activeBot?.id);

  useEffect(() => {
    latestGraphRef.current = state.graph;
  }, [state.graph]);

  useEffect(() => {
    persistedBotIdRef.current = activeBot?.id;
  }, [activeBot?.id]);

  const persistGraph = async (
    origin: "autosave" | "manual",
    graphSnapshot = latestGraphRef.current,
  ) => {
    if (saveInFlightRef.current) {
      queuedSaveOriginRef.current =
        queuedSaveOriginRef.current === "manual" ? "manual" : origin;
      return;
    }

    const localResults = validateBotGraph(graphSnapshot);
    const localErrors = localResults.filter((result) => result.severity === "error");
    setValidationResults(localResults);

    if (localErrors.length > 0) {
      if (origin === "manual") {
        notification.warning({
          message: "Validation found issues",
          description: `${localErrors.length} blocking issue${localErrors.length === 1 ? "" : "s"} found in the current graph.`
        });
      }
      return;
    }

    saveInFlightRef.current = true;

    try {
      const botIdToPersist = persistedBotIdRef.current;
      const shouldCreate = !botIdToPersist;
      const savedBot = shouldCreate
        ? await createBotDraft(graphSnapshot)
        : await updateBotDraft(botIdToPersist, graphSnapshot);

      if (!savedBot) {
        queuedSaveOriginRef.current = undefined;
        if (origin === "manual") {
          notification.error({
            message: "Save failed",
            description: errorMessage ?? "The bot could not be saved."
          });
        }
        return;
      }

      persistedBotIdRef.current = savedBot.id;

      const savedSnapshotKey = JSON.stringify(graphSnapshot);
      const latestSnapshotKey = JSON.stringify(latestGraphRef.current);
      const graphIsStillCurrent = savedSnapshotKey === latestSnapshotKey;

      if (graphIsStillCurrent) {
        markSaved(savedBot.graph);
      } else {
        queuedSaveOriginRef.current =
          queuedSaveOriginRef.current === "manual" ? "manual" : "autosave";
      }

      if (graphIsStillCurrent && !botId) {
        router.replace(`/developer/builder/${savedBot.id}`);
      }

      if (origin === "manual") {
        notification.success({
          message: "Bot saved",
          description: "Your bot draft has been persisted."
        });
      }
    } finally {
      saveInFlightRef.current = false;

      if (queuedSaveOriginRef.current) {
        const nextOrigin = queuedSaveOriginRef.current;
        queuedSaveOriginRef.current = undefined;
        setTimeout(() => {
          void persistGraph(nextOrigin, latestGraphRef.current);
        }, 0);
      }
    }
  };

  useEffect(() => {
    if (!state.isDirty) {
      return undefined;
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      void persistGraph("autosave");
    }, 1200);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [activeBot?.id, state.graph, state.isDirty]);

  const handleSave = async () => {
    await persistGraph("manual");
  };

  const handleValidate = async () => {
    const localResults = runValidation();
    const remoteResults = await validateBotDraft(state.graph);
    const mergedResults = mergeValidationResults(localResults, remoteResults);
    setValidationResults(mergedResults);
    const errors = mergedResults.filter((result) => result.severity === "error").length;

    notification[errors > 0 ? "warning" : "success"]({
      message: errors > 0 ? "Validation found issues" : "Validation passed",
      description:
        errors > 0
          ? `${errors} blocking issue${errors === 1 ? "" : "s"} found in the current graph.`
          : "Your current graph is structurally valid for the MVP rules."
    });
  };

  return (
    <div className={styles.builderShell}>
      <BuilderToolbar
        botName={state.graph.metadata.name}
        isDirty={state.isDirty}
        validationCount={state.validationResults.length}
        saveStatus={saveStatus}
        onBotNameChange={updateBotName}
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
  const router = useRouter();
  const { activeBot, isPending, isError, errorMessage } = useBotState();
  const { clearActiveBot, getBot, initializeNewBotDraft } = useBotActions();
  const initialGraph = useMemo(() => activeBot?.graph, [activeBot]);

  useEffect(() => {
    void (async () => {
      clearActiveBot();

      if (botId) {
        await getBot(botId);
        return;
      }

      await initializeNewBotDraft();
    })();
  }, [botId, clearActiveBot, getBot, initializeNewBotDraft]);

  if (isPending && !initialGraph) {
    return <Spin size="large" />;
  }

  if (isError && !initialGraph) {
    return (
      <Result
        status="error"
        title="Builder unavailable"
        subTitle={errorMessage ?? "This bot could not be loaded."}
        extra={[
          <Button key="projects" type="primary" onClick={() => router.push("/developer/projects")}>
            Back to Projects
          </Button>
        ]}
      />
    );
  }

  if (!initialGraph) {
    return <Spin size="large" />;
  }

  return (
    <BuilderProvider key={initialGraph.metadata.id} graph={initialGraph}>
      <BuilderWorkspaceContent botId={botId} />
    </BuilderProvider>
  );
}

function mergeValidationResults(
  localResults: ValidationResult[],
  remoteResults: ValidationResult[],
): ValidationResult[] {
  const combined = [...localResults, ...remoteResults];
  const seen = new Set<string>();

  return combined.filter((result) => {
    const key = `${result.id}:${result.message}:${result.relatedNodeId ?? ""}:${result.relatedEdgeId ?? ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
