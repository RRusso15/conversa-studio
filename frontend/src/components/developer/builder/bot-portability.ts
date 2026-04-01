"use client";

import type { BotGraph } from "./types";

export const BOT_FILE_EXTENSION = ".cstu";
const BOT_FILE_FORMAT = "conversa-studio-bot";
const BOT_FILE_SCHEMA_VERSION = 1;

interface IExportedBotEnvelope {
    format: typeof BOT_FILE_FORMAT;
    schemaVersion: typeof BOT_FILE_SCHEMA_VERSION;
    exportedAt: string;
    bot: {
        name: string;
        graph: BotGraph;
    };
}

function sanitizeFileName(value: string): string {
    const normalizedValue = (value || "untitled-bot")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return normalizedValue || "untitled-bot";
}

function cloneGraph(graph: BotGraph): BotGraph {
    return JSON.parse(JSON.stringify(graph)) as BotGraph;
}

export function createBotExportPayload(botName: string, graph: BotGraph): string {
    const envelope: IExportedBotEnvelope = {
        format: BOT_FILE_FORMAT,
        schemaVersion: BOT_FILE_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        bot: {
            name: botName,
            graph: cloneGraph(graph)
        }
    };

    return JSON.stringify(envelope, null, 2);
}

export function downloadBotExport(botName: string, graph: BotGraph): void {
    const payload = createBotExportPayload(botName, graph);
    const blob = new Blob([payload], { type: "application/json" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = downloadUrl;
    anchor.download = `${sanitizeFileName(botName)}${BOT_FILE_EXTENSION}`;
    anchor.click();

    window.URL.revokeObjectURL(downloadUrl);
}

export function parseImportedBotFile(fileContents: string): { name: string; graph: BotGraph } {
    let parsedEnvelope: unknown;

    try {
        parsedEnvelope = JSON.parse(fileContents);
    } catch {
        throw new Error("This file is not valid JSON.");
    }

    if (!parsedEnvelope || typeof parsedEnvelope !== "object") {
        throw new Error("This file is not a valid bot export.");
    }

    const envelope = parsedEnvelope as Partial<IExportedBotEnvelope>;
    if (envelope.format !== BOT_FILE_FORMAT) {
        throw new Error("This file is not a Conversa Studio bot export.");
    }

    if (envelope.schemaVersion !== BOT_FILE_SCHEMA_VERSION) {
        throw new Error("This bot export version is not supported.");
    }

    if (!envelope.bot || typeof envelope.bot !== "object") {
        throw new Error("This bot export is missing its bot definition.");
    }

    const bot = envelope.bot as { name?: unknown; graph?: unknown };
    if (typeof bot.name !== "string" || !bot.name.trim()) {
        throw new Error("This bot export is missing a valid bot name.");
    }

    if (!bot.graph || typeof bot.graph !== "object") {
        throw new Error("This bot export is missing a valid graph.");
    }

    return {
        name: bot.name.trim(),
        graph: normalizeImportedGraph(bot.graph as BotGraph, bot.name.trim())
    };
}

function normalizeImportedGraph(graph: BotGraph, botName: string): BotGraph {
    const clonedGraph = cloneGraph(graph);

    if (!clonedGraph.metadata || !Array.isArray(clonedGraph.nodes) || !Array.isArray(clonedGraph.edges)) {
        throw new Error("This bot export graph is malformed.");
    }

    return {
        ...clonedGraph,
        metadata: {
            ...clonedGraph.metadata,
            id: "imported-bot",
            name: botName,
            status: "draft",
            version: "v1"
        }
    };
}
