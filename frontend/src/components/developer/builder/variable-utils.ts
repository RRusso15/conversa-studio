"use client";

import type {
    ApiNodeConfig,
    BotGraph,
    BotNode,
    CodeNodeConfig,
    CodeOperation,
    ConditionNodeConfig,
    ConditionOperator,
    HandoffNodeConfig,
    NodeConfig,
    QuestionChoiceOption,
    QuestionNodeConfig,
    VariableNodeConfig
} from "./types";

const VARIABLE_REFERENCE_PATTERN = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
const CODE_VARIABLE_ASSIGNMENT_PATTERNS = [
    /vars\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g,
    /vars\[['"]([a-zA-Z_][a-zA-Z0-9_]*)['"]\]\s*=/g
];

/**
 * Returns the set of variable names currently defined in the graph.
 */
export function collectGraphVariables(graph: BotGraph): string[] {
    const variables = new Set<string>();

    graph.nodes.forEach((node) => {
        const variableName = getDefinedVariableName(node);

        if (variableName) {
            variables.add(variableName);
        }

        if (node.config.kind === "code") {
            extractCodeAssignedVariables(node.config.script).forEach((assignedVariable) => {
                variables.add(assignedVariable);
            });
        }
    });

    return Array.from(variables).sort((left, right) => left.localeCompare(right));
}

/**
 * Replaces {variableName} tokens with current runtime values.
 */
export function interpolateVariableText(
    template: string,
    variables: Record<string, string>
): string {
    return template.replace(VARIABLE_REFERENCE_PATTERN, (_, variableName: string) => {
        return variables[variableName] ?? `{${variableName}}`;
    });
}

/**
 * Extracts referenced variables from a freeform text field.
 */
export function extractVariableReferences(template: string): string[] {
    const matches = template.matchAll(VARIABLE_REFERENCE_PATTERN);
    const references = new Set<string>();

    for (const match of matches) {
        const variableName = match[1]?.trim();

        if (variableName) {
            references.add(variableName);
        }
    }

    return Array.from(references);
}

/**
 * Returns a normalized variable operation for backwards-compatible configs.
 */
export function getVariableOperation(config: VariableNodeConfig): "set" | "append" | "clear" | "copy" {
    return config.operation ?? "set";
}

/**
 * Normalizes a condition node config loaded from older graph versions.
 */
export function normalizeConditionConfig(config: ConditionNodeConfig & { mode?: string }): ConditionNodeConfig {
    return {
        kind: "condition",
        variableName: normalizeVariableName(config.variableName) ?? "",
        rules: config.rules.map((rule, index) => ({
            id: rule.id || `rule-${index + 1}`,
            operator: normalizeConditionOperator(rule.operator),
            value: rule.value ?? ""
        })),
        fallbackLabel: config.fallbackLabel?.trim() || "Fallback"
    };
}

/**
 * Normalizes a question node config loaded from older graph versions.
 */
export function normalizeQuestionConfig(config: QuestionNodeConfig): QuestionNodeConfig {
    const inputMode = config.inputMode === "choice" ? "choice" : "text";
    const legacyOptions = (config.options ?? []) as Array<QuestionChoiceOption | string>;
    const options = legacyOptions
        .map((option, index) => normalizeQuestionOption(option, index))
        .filter((option): option is QuestionChoiceOption => Boolean(option));

    return {
        kind: "question",
        question: config.question ?? "",
        variableName: normalizeVariableName(config.variableName) ?? "",
        inputMode,
        options,
        invalidInputMessage: config.invalidInputMessage?.trim() || "Please choose one of the available options."
    };
}

/**
 * Normalizes a code node config loaded from older graph versions.
 */
export function normalizeCodeConfig(config: CodeNodeConfig & { snippet?: string }): CodeNodeConfig {
    const legacyConfig = config as CodeNodeConfig & {
        targetVariable?: string;
        operation?: "template" | "lowercase" | "uppercase" | "trim" | "concat";
        input?: string;
        secondInput?: string;
    };

    return {
        kind: "code",
        script: config.script?.trim() || buildLegacyCodeScript(legacyConfig),
        timeoutMs: typeof config.timeoutMs === "number" && config.timeoutMs > 0 ? config.timeoutMs : 1000
    };
}

/**
 * Normalizes an API node config loaded from older graph versions.
 */
export function normalizeApiConfig(config: ApiNodeConfig): ApiNodeConfig {
    return {
        kind: "api",
        endpoint: config.endpoint ?? "",
        method: config.method === "POST" ? "POST" : "GET",
        headers: (config.headers ?? []).map((header, index) => ({
            id: header.id || `header-${index + 1}`,
            key: header.key ?? "",
            value: header.value ?? ""
        })),
        body: config.body ?? "",
        timeoutMs: typeof config.timeoutMs === "number" && config.timeoutMs > 0 ? config.timeoutMs : 10000,
        responseMappings: (config.responseMappings ?? []).map((mapping, index) => ({
            id: mapping.id || `mapping-${index + 1}`,
            variableName: normalizeVariableName(mapping.variableName) ?? "",
            path: mapping.path ?? "body"
        })),
        successLabel: config.successLabel?.trim() || "Success",
        errorLabel: config.errorLabel?.trim() || "Error"
    };
}

/**
 * Normalizes an AI node config loaded from older graph versions.
 */
export function normalizeAiConfig(config: NodeConfig & { kind: "ai"; responseMode?: string }) {
    const responseMode: "strict" | "hybrid" | "free" =
        config.responseMode === "hybrid" || config.responseMode === "free"
            ? config.responseMode
            : "strict";

    return {
        kind: "ai" as const,
        instructions: config.instructions ?? "",
        fallbackText: config.fallbackText ?? "",
        responseMode
    };
}

/**
 * Normalizes a handoff node config loaded from older graph versions.
 */
export function normalizeHandoffConfig(
    config: HandoffNodeConfig & {
        queueName?: string;
        confirmationText?: string;
        contactVariable?: string;
    }
): HandoffNodeConfig {
    return {
        kind: "handoff",
        inboxKey: config.inboxKey?.trim() || config.queueName?.trim() || "",
        confirmationMessage:
            config.confirmationMessage?.trim() ||
            config.confirmationText?.trim() ||
            "Thanks. Our team will review your message and follow up by email.",
        contactEmailVariable:
            normalizeVariableName(config.contactEmailVariable) ??
            normalizeVariableName(config.contactVariable) ??
            "email",
        queueName: config.queueName?.trim() || undefined,
    };
}

function getDefinedVariableName(node: BotNode): string | undefined {
    if (node.config.kind === "question") {
        return normalizeVariableName(node.config.variableName);
    }

    if (node.config.kind === "variable") {
        return normalizeVariableName(node.config.variableName);
    }

    return undefined;
}

export function extractCodeAssignedVariables(script: string): string[] {
    const assignedVariables = new Set<string>();

    CODE_VARIABLE_ASSIGNMENT_PATTERNS.forEach((pattern) => {
        const matches = script.matchAll(pattern);

        for (const match of matches) {
            const variableName = match[1]?.trim();

            if (variableName) {
                assignedVariables.add(variableName);
            }
        }
    });

    return Array.from(assignedVariables);
}

export function normalizeVariableName(value?: string): string | undefined {
    const normalizedValue = value?.trim();

    if (!normalizedValue) {
        return undefined;
    }

    return normalizedValue;
}

export function normalizeConditionOperator(value?: string): ConditionOperator {
    switch (value) {
        case "contains":
        case "startsWith":
        case "endsWith":
        case "isEmpty":
        case "isNotEmpty":
            return value;
        case "equals":
        default:
            return "equals";
    }
}

export function conditionOperatorRequiresValue(operator: ConditionOperator): boolean {
    return operator !== "isEmpty" && operator !== "isNotEmpty";
}

export function normalizeCodeOperation(value?: string): CodeOperation {
    switch (value) {
        case "lowercase":
        case "uppercase":
        case "trim":
        case "concat":
            return value;
        case "template":
        default:
            return "template";
    }
}

export function getNodeTextTemplates(config: NodeConfig): string[] {
    switch (config.kind) {
        case "message":
            return [config.message];
        case "question":
            return [
                config.question,
                ...(config.options ?? []).flatMap((option) => [option.label, option.value ?? ""])
            ];
        case "variable":
            return getVariableOperation(config) === "clear" ? [] : [config.value];
        case "api":
            return [
                config.endpoint,
                ...(config.headers ?? []).flatMap((header) => [header.key, header.value]),
                config.body ?? ""
            ];
        case "ai":
            return [config.instructions, config.fallbackText];
        case "code":
            return [];
        case "handoff":
            return [config.confirmationMessage];
        case "end":
            return [config.closingText];
        default:
            return [];
    }
}

export function getQuestionChoiceValue(option: QuestionChoiceOption): string {
    return option.value?.trim() || option.label.trim();
}

export function getQuestionChoiceHandleId(optionId: string): string {
    return `option-${optionId}`;
}

export function createQuestionChoiceOption(seed?: number): QuestionChoiceOption {
    const suffix = typeof seed === "number" ? `${seed}-${Date.now()}` : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return {
        id: `choice-${suffix}`,
        label: "",
        value: ""
    };
}

function normalizeQuestionOption(option: QuestionChoiceOption | string, index: number): QuestionChoiceOption | undefined {
    if (typeof option === "string") {
        const normalizedLabel = option.trim();

        if (!normalizedLabel) {
            return undefined;
        }

        return {
            id: `option-${index + 1}`,
            label: normalizedLabel,
            value: normalizedLabel
        };
    }

    const normalizedLabel = option.label?.trim() ?? "";

    if (!normalizedLabel) {
        return undefined;
    }

    return {
        id: option.id?.trim() || `option-${index + 1}`,
        label: normalizedLabel,
        value: option.value?.trim() || normalizedLabel
    };
}

function buildLegacyCodeScript(config: {
    targetVariable?: string;
    operation?: "template" | "lowercase" | "uppercase" | "trim" | "concat";
    input?: string;
    secondInput?: string;
    snippet?: string;
}): string {
    const targetVariable = normalizeVariableName(config.targetVariable) ?? "codeResult";
    const primaryInput = JSON.stringify(config.input ?? config.snippet ?? "");
    const secondaryInput = JSON.stringify(config.secondInput ?? "");

    switch (normalizeCodeOperation(config.operation)) {
        case "lowercase":
            return `vars[${JSON.stringify(targetVariable)}] = String(interpolate(${primaryInput})).toLowerCase();`;
        case "uppercase":
            return `vars[${JSON.stringify(targetVariable)}] = String(interpolate(${primaryInput})).toUpperCase();`;
        case "trim":
            return `vars[${JSON.stringify(targetVariable)}] = String(interpolate(${primaryInput})).trim();`;
        case "concat":
            return `vars[${JSON.stringify(targetVariable)}] = String(interpolate(${primaryInput})) + String(interpolate(${secondaryInput}));`;
        case "template":
        default:
            return `vars[${JSON.stringify(targetVariable)}] = interpolate(${primaryInput});`;
    }
}
