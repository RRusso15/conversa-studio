"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Grid, Result, Spin } from "antd";
import { BuilderProvider, useBuilder } from "./builder/builder-context";
import { BuilderCanvas } from "./builder/BuilderCanvas";
import { BuilderPropertiesPanel } from "./builder/BuilderPropertiesPanel";
import { BuilderSimulatorDrawer } from "./builder/BuilderSimulatorDrawer";
import { BuilderToolbar } from "./builder/BuilderToolbar";
import { BuilderValidationPanel } from "./builder/BuilderValidationPanel";
import { NodePalette } from "./builder/NodePalette";
import { useBuilderStyles } from "./builder/styles";
import { downloadBotExport, parseImportedBotFile } from "./builder/bot-portability";
import { useBotActions, useBotState } from "@/providers/botProvider";
import { validateBotGraph } from "./builder/validation";
import type { BotGraph, ValidationResult } from "./builder/types";

interface BuilderWorkspaceProps {
  botId?: string;
}

interface BuilderWorkspaceContentProps {
  botId?: string;
}

const BUILDER_RIGHT_PANEL_WIDTH_KEY = "builder:right-panel-width";
const DEFAULT_RIGHT_PANEL_WIDTH = 360;
const MIN_RIGHT_PANEL_WIDTH = 320;
const MAX_RIGHT_PANEL_WIDTH = 640;

function BuilderWorkspaceContent({ botId }: BuilderWorkspaceContentProps) {
  const screens = Grid.useBreakpoint();
  const { notification } = App.useApp();
  const router = useRouter();
  const { styles } = useBuilderStyles();
  const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_RIGHT_PANEL_WIDTH);
  const {
    state,
    runValidation,
    setSimulatorOpen,
    updateBotName,
    setValidationResults,
    markSaved,
    undo,
    redo,
    canUndo,
    canRedo
  } = useBuilder();
  const { activeBot, saveStatus, errorMessage, draftIdentity } = useBotState();
  const { createBotDraft, updateBotDraft, publishBotDraft, validateBotDraft, setSaveStatus } = useBotActions();
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const saveInFlightRef = useRef(false);
  const queuedSaveOriginRef = useRef<"autosave" | "manual" | undefined>(undefined);
  const latestGraphRef = useRef(state.graph);
  const persistedBotIdRef = useRef<string | undefined>(activeBot?.id);

  useEffect(() => {
    latestGraphRef.current = state.graph;
  }, [state.graph]);

  useEffect(() => {
    persistedBotIdRef.current = toPersistedBotId(activeBot?.id);
  }, [activeBot?.id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedWidth = window.localStorage.getItem(BUILDER_RIGHT_PANEL_WIDTH_KEY);
    if (!storedWidth) {
      return;
    }

    const parsedWidth = Number(storedWidth);
    if (!Number.isFinite(parsedWidth)) {
      return;
    }

    setRightPanelWidth(clampRightPanelWidth(parsedWidth));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(BUILDER_RIGHT_PANEL_WIDTH_KEY, String(rightPanelWidth));
  }, [rightPanelWidth]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || isTypingTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const wantsUndo = key === "z" && !event.shiftKey;
      const wantsRedo = key === "y" || (key === "z" && event.shiftKey);

      if (wantsUndo && canUndo) {
        event.preventDefault();
        undo();
      }

      if (wantsRedo && canRedo) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canRedo, canUndo, redo, undo]);

  const persistGraph = async (
    origin: "autosave" | "manual",
    graphSnapshot = latestGraphRef.current,
  ) => {
    if (saveInFlightRef.current) {
      queuedSaveOriginRef.current =
        queuedSaveOriginRef.current === "manual" ? "manual" : origin;
      return undefined;
    }

    const localResults = validateBotGraph(graphSnapshot, activeBot?.aiKnowledge, draftIdentity);
    const localErrors = localResults.filter((result) => result.severity === "error");
    setValidationResults(localResults);

    if (localErrors.length > 0) {
      setSaveStatus(
        "validation_blocked",
        localErrors.map((result) => result.message).join(" ")
      );

      if (origin === "manual") {
        notification.warning({
          message: "Save blocked by validation",
          description: localErrors.map((result) => result.message).join(" ")
        });
      }
      return undefined;
    }

    saveInFlightRef.current = true;

    try {
      const botIdToPersist = toPersistedBotId(persistedBotIdRef.current);
      const shouldCreate = !botIdToPersist;
      const mutationResult = shouldCreate
        ? await createBotDraft(graphSnapshot)
        : await updateBotDraft(botIdToPersist, graphSnapshot);

      if (!mutationResult.bot) {
        queuedSaveOriginRef.current = undefined;
        if (origin === "manual") {
          notification.error({
            message: "Save failed",
            description: mutationResult.error?.message ?? errorMessage ?? "The bot could not be saved."
          });
        }
        return undefined;
      }

      const savedBot = mutationResult.bot;
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

      return savedBot;
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

  const handleExport = () => {
    downloadBotExport(state.graph.metadata.name, state.graph);
    notification.success({
      message: "Bot exported",
      description: "Your bot definition has been downloaded as a .cstu file."
    });
  };

  const handleImport = () => {
    importFileInputRef.current?.click();
  };

  const handleImportedFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    let importedBot: { name: string; graph: BotGraph };

    try {
      const fileContents = await file.text();
      importedBot = parseImportedBotFile(fileContents);
    } catch (error) {
      notification.error({
        message: "Import failed",
        description: error instanceof Error ? error.message : "The selected file could not be imported."
      });
      return;
    }

    const localResults = validateBotGraph(importedBot.graph, undefined, "temporary");
    const localErrors = localResults.filter((result) => result.severity === "error");

    if (localErrors.length > 0) {
      notification.error({
        message: "Import blocked by validation",
        description: localErrors.map((result) => result.message).join(" ")
      });
      return;
    }

    const creationResult = await createBotDraft(importedBot.graph);

    if (!creationResult.bot) {
      notification.error({
        message: "Import failed",
        description: creationResult.error?.message ?? "The imported bot could not be created."
      });
      return;
    }

    notification.success({
      message: "Bot imported",
      description: `${creationResult.bot.name} was created as a new draft bot.`
    });
    router.replace(`/developer/builder/${creationResult.bot.id}`);
  };

  const handleDeploy = async () => {
    const savedBot = await persistGraph("manual");
    const persistedBotId = toPersistedBotId(savedBot?.id ?? activeBot?.id);

    if (!persistedBotId) {
      return;
    }

    const latestBot = savedBot ?? activeBot;
    const requiresPublish = !latestBot?.publishedVersion || latestBot.hasUnpublishedChanges;

    if (requiresPublish) {
      const publishResult = await publishBotDraft(persistedBotId);

      if (!publishResult.bot) {
        notification.error({
          message: "Publish failed",
          description: publishResult.error?.message ?? "The bot could not be published for deployment."
        });
        return;
      }

      notification.success({
        message: "Bot published",
        description: "The latest draft is now ready for deployment."
      });
    }

    router.push(`/developer/deployments?botId=${encodeURIComponent(persistedBotId)}`);
  };

  const handleValidate = async () => {
    const localResults = runValidation();
    const validationOutcome = await validateBotDraft(state.graph);
    if (!validationOutcome.results) {
      notification.error({
        message: "Validation could not be completed",
        description:
          validationOutcome.error?.message ??
          errorMessage ??
          "The builder could not validate this bot with the backend."
      });
      return;
    }

    const remoteResults = validationOutcome.results;
    const mergedResults = mergeValidationResults(localResults, remoteResults);
    setValidationResults(mergedResults);
    const errors = mergedResults.filter((result) => result.severity === "error").length;

    notification[errors > 0 ? "warning" : "success"]({
      message: errors > 0 ? "Validation found issues" : "Validation passed",
      description:
        errors > 0
          ? `${errors} blocking issue${errors === 1 ? "" : "s"} found in the current graph.`
          : "Your current graph is structurally valid for the current builder rules."
    });
  };

  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window === "undefined" || window.innerWidth <= 1100) {
      return;
    }

    event.preventDefault();

    const handlePointerMove = (moveEvent: MouseEvent) => {
      const nextWidth = clampRightPanelWidth(window.innerWidth - moveEvent.clientX);
      setRightPanelWidth(nextWidth);
    };

    const handlePointerUp = () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
  };

  return (
    <div
      className={styles.builderShell}
      style={{ ["--builder-right-panel-width" as string]: `${rightPanelWidth}px` }}
    >
      <BuilderToolbar
        botName={state.graph.metadata.name}
        isDirty={state.isDirty}
        validationCount={state.validationResults.length}
        saveStatus={saveStatus}
        deployLabel={activeBot?.publishedVersion && !activeBot.hasUnpublishedChanges ? "Manage Deployments" : "Publish & Deploy"}
        onBotNameChange={updateBotName}
        onUndo={undo}
        onRedo={redo}
        onSave={handleSave}
        onExport={handleExport}
        onImport={handleImport}
        onValidate={handleValidate}
        onTest={() => setSimulatorOpen(true)}
        onDeploy={handleDeploy}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <input
        ref={importFileInputRef}
        type="file"
        accept=".cstu,application/json,.json"
        style={{ display: "none" }}
        onChange={(event) => void handleImportedFileSelected(event)}
      />

      <div className={styles.builderMain}>
        <aside className={styles.builderPanel}>
          <NodePalette />
        </aside>

        <main className={styles.builderCanvasRegion}>
          <BuilderCanvas />
        </main>

        <div
          className={styles.builderResizeHandle}
          onMouseDown={handleResizeStart}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize right panel"
        />

        <aside className={styles.builderRightPanel}>
          <div className={`${styles.builderSideSection} ${styles.builderPropertiesSection}`}>
            <BuilderPropertiesPanel compact={!screens.xl} />
          </div>
          <div className={`${styles.builderSideSection} ${styles.builderValidationSection}`}>
            <BuilderValidationPanel />
          </div>
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

function toPersistedBotId(id?: string): string | undefined {
  if (!id) {
    return undefined;
  }

  return isGuid(id) ? id : undefined;
}

function isGuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

function clampRightPanelWidth(value: number): number {
  return Math.min(MAX_RIGHT_PANEL_WIDTH, Math.max(MIN_RIGHT_PANEL_WIDTH, Math.round(value)));
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  return target.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select";
}
