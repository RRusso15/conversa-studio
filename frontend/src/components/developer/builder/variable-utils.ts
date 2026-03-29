"use client";

import type {
    ApiNodeConfig,
    BotGraph,
    BotNode,
    CodeNodeConfig,
    ConditionNodeConfig,
    ConditionOperator,
    NodeConfig,
    QuestionNodeConfig,
    VariableNodeConfig
} from "./types";

const VARIABLE_REFERENCE_PATTERN = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

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
    const options = (config.options ?? [])
        .map((option) => option?.trim() ?? "")
        .filter((option, index, collection) => option.length > 0 && collection.indexOf(option) === index);

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
    return {
        kind: "code",
        targetVariable: normalizeVariableName(config.targetVariable) ?? "codeResult",
        operation: normalizeCodeOperation(config.operation),
        input: config.input ?? config.snippet ?? "",
        secondInput: config.secondInput ?? ""
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

function getDefinedVariableName(node: BotNode): string | undefined {
    if (node.config.kind === "question") {
        return normalizeVariableName(node.config.variableName);
    }

    if (node.config.kind === "variable") {
        return normalizeVariableName(node.config.variableName);
    }

    return undefined;
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

export function normalizeCodeOperation(value?: string): CodeNodeConfig["operation"] {
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
            return [config.question];
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
            return config.operation === "concat"
                ? [config.input, config.secondInput ?? ""]
                : [config.input];
        case "end":
            return [config.closingText];
        default:
            return [];
    }
}
