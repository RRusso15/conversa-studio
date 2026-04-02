"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Card, Grid, Result } from "antd";
import { BuilderProvider, useBuilder } from "@/components/developer/builder/builder-context";
import { BuilderCanvas } from "@/components/developer/builder/BuilderCanvas";
import { BuilderPropertiesPanel } from "@/components/developer/builder/BuilderPropertiesPanel";
import { BuilderSimulatorDrawer } from "@/components/developer/builder/BuilderSimulatorDrawer";
import { BuilderToolbar } from "@/components/developer/builder/BuilderToolbar";
import { BuilderValidationPanel } from "@/components/developer/builder/BuilderValidationPanel";
import { NodePalette } from "@/components/developer/builder/NodePalette";
import { downloadBotExport, parseImportedBotFile } from "@/components/developer/builder/bot-portability";
import { useBuilderStyles } from "@/components/developer/builder/styles";
import type { ValidationResult } from "@/components/developer/builder/types";
import { validateBotGraph } from "@/components/developer/builder/validation";
import {
  getTemplate,
  publishTemplateDraft,
  toTemplateApiError,
  updateTemplateDraft,
  validateTemplateDraft,
  type ITemplateDefinition,
} from "@/utils/template-api";
import { AppLoader } from "@/components/shared/AppLoader";

const BUILDER_RIGHT_PANEL_WIDTH_KEY = "template-builder:right-panel-width";
const DEFAULT_RIGHT_PANEL_WIDTH = 360;
const MIN_RIGHT_PANEL_WIDTH = 320;
const MAX_RIGHT_PANEL_WIDTH = 640;
const MIN_BUILDER_WIDTH = 1100;

interface AdminTemplateBuilderWorkspaceProps {
  templateId: string;
}

type EditorSaveStatus = "idle" | "saving" | "saved" | "error" | "validation_blocked" | "permission_denied" | "api_mismatch";

interface AdminTemplateBuilderContentProps {
  template: ITemplateDefinition;
  onTemplateUpdated: (template: ITemplateDefinition) => void;
}

function AdminTemplateBuilderContent({ template, onTemplateUpdated }: AdminTemplateBuilderContentProps) {
  const screens = Grid.useBreakpoint();
  const router = useRouter();
  const { notification } = App.useApp();
  const { styles } = useBuilderStyles();
  const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_RIGHT_PANEL_WIDTH);
  const [saveStatus, setSaveStatus] = useState<EditorSaveStatus>("idle");
  const {
    state,
    runValidation,
    setSimulatorOpen,
    updateBotName,
    setValidationResults,
    markSaved,
    resetGraph,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useBuilder();
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const saveInFlightRef = useRef(false);
  const queuedSaveOriginRef = useRef<"autosave" | "manual" | undefined>(undefined);
  const latestGraphRef = useRef(state.graph);

  useEffect(() => {
    latestGraphRef.current = state.graph;
  }, [state.graph]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedWidth = window.localStorage.getItem(BUILDER_RIGHT_PANEL_WIDTH_KEY);
    if (!storedWidth) {
      return;
    }

    const parsedWidth = Number(storedWidth);
    if (Number.isFinite(parsedWidth)) {
      setRightPanelWidth(clampRightPanelWidth(parsedWidth));
    }
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
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canRedo, canUndo, redo, undo]);

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
  }, [state.graph, state.isDirty]);

  const persistGraph = async (
    origin: "autosave" | "manual",
    graphSnapshot = latestGraphRef.current,
  ) => {
    if (saveInFlightRef.current) {
      queuedSaveOriginRef.current = queuedSaveOriginRef.current === "manual" ? "manual" : origin;
      return undefined;
    }

    const localResults = validateBotGraph(graphSnapshot, undefined, "temporary");
    const localErrors = localResults.filter((result) => result.severity === "error");
    setValidationResults(localResults);

    if (localErrors.length > 0) {
      setSaveStatus("validation_blocked");

      if (origin === "manual") {
        notification.warning({
          message: "Save blocked by validation",
          description: localErrors.map((result) => result.message).join(" ")
        });
      }
      return undefined;
    }

    saveInFlightRef.current = true;
    setSaveStatus("saving");

    try {
      const savedTemplate = await updateTemplateDraft(template.id, {
        name: graphSnapshot.metadata.name,
        description: template.description,
        category: template.category,
        graph: graphSnapshot
      });

      onTemplateUpdated(savedTemplate);

      const savedSnapshotKey = JSON.stringify(graphSnapshot);
      const latestSnapshotKey = JSON.stringify(latestGraphRef.current);
      const graphIsStillCurrent = savedSnapshotKey === latestSnapshotKey;

      if (graphIsStillCurrent) {
        markSaved(savedTemplate.graph);
        setSaveStatus("saved");
      } else {
        queuedSaveOriginRef.current = queuedSaveOriginRef.current === "manual" ? "manual" : "autosave";
      }

      if (origin === "manual") {
        notification.success({
          message: "Template saved",
          description: "Your template draft has been persisted."
        });
      }

      return savedTemplate;
    } catch (error) {
      setSaveStatus("error");

      if (origin === "manual") {
        notification.error({
          message: "Save failed",
          description: toTemplateApiError(error, "The template could not be saved.").message
        });
      }

      return undefined;
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

  const handleValidate = async () => {
    const localResults = runValidation();

    try {
      const remoteResults = await validateTemplateDraft(state.graph);
      const mergedResults = mergeValidationResults(localResults, remoteResults);
      setValidationResults(mergedResults);
      const errors = mergedResults.filter((result) => result.severity === "error").length;

      notification[errors > 0 ? "warning" : "success"]({
        message: errors > 0 ? "Validation found issues" : "Validation passed",
        description:
          errors > 0
            ? `${errors} blocking issue${errors === 1 ? "" : "s"} found in the current graph.`
            : "Your current graph is structurally valid for the template builder."
      });
    } catch (error) {
      notification.error({
        message: "Validation could not be completed",
        description: toTemplateApiError(error, "The template could not be validated.").message
      });
    }
  };

  const handlePublish = async () => {
    const savedTemplate = await persistGraph("manual");
    const templateToPublish = savedTemplate ?? template;

    try {
      const publishedTemplate = await publishTemplateDraft(templateToPublish.id);
      onTemplateUpdated(publishedTemplate);
      notification.success({
        message: "Template published",
        description: "Developers can now use this template from the template library."
      });
      router.push("/admin/templates");
    } catch (error) {
      notification.error({
        message: "Template could not be published",
        description: toTemplateApiError(error, "The template could not be published.").message
      });
    }
  };

  const handleImportedFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const fileContents = await file.text();
      const importedBot = parseImportedBotFile(fileContents);
      resetGraph(importedBot.graph);
      notification.success({
        message: "Template imported",
        description: "The imported graph replaced the current template draft in the editor."
      });
    } catch (error) {
      notification.error({
        message: "Import failed",
        description: error instanceof Error ? error.message : "The selected file could not be imported."
      });
    }
  };

  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window === "undefined" || window.innerWidth <= MIN_BUILDER_WIDTH) {
      return;
    }

    event.preventDefault();

    const handlePointerMove = (moveEvent: MouseEvent) => {
      setRightPanelWidth(clampRightPanelWidth(window.innerWidth - moveEvent.clientX));
    };

    const handlePointerUp = () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
  };

  return (
    <div className={styles.builderShell} style={{ ["--builder-right-panel-width" as string]: `${rightPanelWidth}px` }}>
      <BuilderToolbar
        botName={state.graph.metadata.name}
        backHref="/admin/templates"
        backLabel="Back to Templates"
        subtitle="Author reusable starter flows that developers can apply and extend in their own bots."
        isDirty={state.isDirty}
        validationCount={state.validationResults.length}
        saveStatus={saveStatus}
        primaryActionLabel={template.publishedVersion && !template.hasUnpublishedChanges ? "Publish latest draft" : "Publish Template"}
        onBotNameChange={updateBotName}
        onSave={() => void persistGraph("manual")}
        onExport={() => downloadBotExport(state.graph.metadata.name, state.graph)}
        onImport={() => importFileInputRef.current?.click()}
        onValidate={() => void handleValidate()}
        onTest={() => setSimulatorOpen(true)}
        onPrimaryAction={() => void handlePublish()}
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
          <BuilderCanvas onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo} />
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
            <BuilderPropertiesPanel compact={!screens.xl} editorMode="template" />
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

export function AdminTemplateBuilderWorkspace({ templateId }: AdminTemplateBuilderWorkspaceProps) {
  const router = useRouter();
  const { styles } = useBuilderStyles();
  const [template, setTemplate] = useState<ITemplateDefinition>();
  const [isPending, setIsPending] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  useEffect(() => {
    void loadTemplate();
  }, [templateId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncViewportWidth = () => setViewportWidth(window.innerWidth);
    syncViewportWidth();
    window.addEventListener("resize", syncViewportWidth);
    return () => window.removeEventListener("resize", syncViewportWidth);
  }, []);

  const initialGraph = useMemo(() => template?.graph, [template]);

  if (isPending && !initialGraph) {
    return <AppLoader label="Loading template editor" />;
  }

  if (errorMessage && !initialGraph) {
    return (
      <Result
        status="error"
        title="Template builder unavailable"
        subTitle={errorMessage}
        extra={[
          <Button key="templates" type="primary" onClick={() => router.push("/admin/templates")}>
            Back to Templates
          </Button>
        ]}
      />
    );
  }

  if (!initialGraph) {
    return <AppLoader label="Preparing template editor" />;
  }

  if (viewportWidth !== null && viewportWidth < MIN_BUILDER_WIDTH) {
    return (
      <div className={styles.builderBlockedShell}>
        <Card className={styles.builderBlockedCard}>
          <Result
            status="warning"
            title="Builder requires a wider screen"
            subTitle={`Open the template builder on a screen at least ${MIN_BUILDER_WIDTH}px wide to edit template flows.`}
            extra={[
              <Button key="templates" type="primary" onClick={() => router.push("/admin/templates")}>
                Back to Templates
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <BuilderProvider key={initialGraph.metadata.id} graph={initialGraph}>
      <AdminTemplateBuilderContent template={template as ITemplateDefinition} onTemplateUpdated={setTemplate} />
    </BuilderProvider>
  );

  async function loadTemplate() {
    setIsPending(true);
    setErrorMessage(undefined);

    try {
      const loadedTemplate = await getTemplate(templateId);
      setTemplate(loadedTemplate);
    } catch (error) {
      setErrorMessage(toTemplateApiError(error, "The template could not be loaded.").message);
    } finally {
      setIsPending(false);
    }
  }
}

function mergeValidationResults(localResults: ValidationResult[], remoteResults: ValidationResult[]): ValidationResult[] {
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
