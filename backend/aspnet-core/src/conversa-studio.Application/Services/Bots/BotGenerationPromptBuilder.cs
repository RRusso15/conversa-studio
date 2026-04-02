using System;
using System.Collections.Generic;
using System.Linq;
using ConversaStudio.Domains.Bots;

namespace ConversaStudio.Services.Bots;

/// <summary>
/// Builds the shared prompt contract used for prompt-based bot graph generation and repair.
/// </summary>
public static class BotGenerationPromptBuilder
{
    /// <summary>
    /// Builds the first-pass generation prompt using the full builder contract.
    /// </summary>
    public static string BuildGenerationPrompt(string userPrompt, string requestedName)
    {
        return $@"You generate JSON for a visual chatbot builder.

Return JSON only. Do not wrap it in markdown. Do not explain anything.

{BuildSharedContract(requestedName)}

User request:
{userPrompt}";
    }

    /// <summary>
    /// Builds the repair prompt using the same builder contract and the validation issues.
    /// </summary>
    public static string BuildRepairPrompt(
        string originalPrompt,
        string requestedName,
        string serializedGraph,
        IReadOnlyList<BotValidationIssue> issues)
    {
        var issueText = string.Join(Environment.NewLine, issues.Select(issue => $"- {issue.Message}"));

        return $@"Repair this bot graph JSON so it becomes valid and builder-usable.

Return JSON only. Do not wrap it in markdown. Do not explain anything.

{BuildSharedContract(requestedName)}

Additional repair rules:
- Do not omit required config keys.
- Preserve the user's intent, but simplify the flow when needed to keep it valid.
- Prefer safer node types when the original draft overused advanced nodes.
- Keep IDs stable where possible.

Original user request:
{originalPrompt}

Validation issues:
{issueText}

Current invalid JSON:
{serializedGraph}";
    }

    private static string BuildSharedContract(string requestedName)
    {
        return $@"Create a valid BotGraph object with this exact top-level shape:
{{
  ""metadata"": {{
    ""id"": ""generated-bot"",
    ""name"": ""{requestedName}"",
    ""status"": ""draft"",
    ""version"": ""v1"",
    ""handoffInboxes"": []
  }},
  ""nodes"": [],
  ""edges"": []
}}

Every node must use this exact shape:
{{
  ""id"": ""unique-node-id"",
  ""type"": ""message"",
  ""label"": ""Message"",
  ""position"": {{
    ""x"": 120,
    ""y"": 240
  }},
  ""config"": {{}}
}}

Supported node types and config contracts:
- start: {{ ""kind"": ""start"" }}
- message: {{ ""kind"": ""message"", ""message"": ""Hi there. How can I help today?"" }}
- question: {{ ""kind"": ""question"", ""question"": ""What can I help you with today?"", ""variableName"": ""userIntent"", ""inputMode"": ""text"" | ""choice"", ""options"": [], ""invalidInputMessage"": ""Please choose one of the available options."" }}
- condition: {{ ""kind"": ""condition"", ""variableName"": ""userIntent"", ""rules"": [{{ ""id"": ""condition-rule-1"", ""operator"": ""equals"" | ""contains"" | ""startsWith"" | ""endsWith"" | ""isEmpty"" | ""isNotEmpty"", ""value"": ""faq"" }}], ""fallbackLabel"": ""Fallback"" }}
- variable: {{ ""kind"": ""variable"", ""variableName"": ""customerName"", ""operation"": ""set"" | ""append"" | ""clear"" | ""copy"", ""value"": """", ""sourceVariableName"": """" }}
- api: {{ ""kind"": ""api"", ""endpoint"": ""https://api.example.com/orders"", ""method"": ""GET"" | ""POST"", ""headers"": [{{ ""id"": ""header-1"", ""key"": ""Authorization"", ""value"": ""Bearer token"" }}], ""body"": """", ""timeoutMs"": 10000, ""responseMappings"": [{{ ""id"": ""mapping-1"", ""variableName"": ""apiResult"", ""path"": ""body"" }}], ""successLabel"": ""Success"", ""errorLabel"": ""Error"" }}
- ai: {{ ""kind"": ""ai"", ""instructions"": ""Answer the question using the attached knowledge base."", ""fallbackText"": ""I'm not confident enough to answer that yet."", ""responseMode"": ""strict"" | ""hybrid"" | ""free"" }}
- code: {{ ""kind"": ""code"", ""script"": ""vars.result = vars.userIntent ?? \""\"";"", ""timeoutMs"": 1000 }}
- handoff: {{ ""kind"": ""handoff"", ""inboxKey"": ""support"", ""confirmationMessage"": ""Thanks. Our team will review your message and follow up by email."", ""contactEmailVariable"": ""email"" }}
- end: {{ ""kind"": ""end"", ""closingText"": ""Thanks for chatting with us."" }}

Valid full-node examples:
- start node:
  {{
    ""id"": ""start-1"",
    ""type"": ""start"",
    ""label"": ""Start"",
    ""position"": {{ ""x"": 120, ""y"": 60 }},
    ""config"": {{ ""kind"": ""start"" }}
  }}
- message node:
  {{
    ""id"": ""message-1"",
    ""type"": ""message"",
    ""label"": ""Welcome Message"",
    ""position"": {{ ""x"": 120, ""y"": 180 }},
    ""config"": {{ ""kind"": ""message"", ""message"": ""Hi there. How can I help today?"" }}
  }}
- question node:
  {{
    ""id"": ""question-1"",
    ""type"": ""question"",
    ""label"": ""Ask Intent"",
    ""position"": {{ ""x"": 120, ""y"": 300 }},
    ""config"": {{
      ""kind"": ""question"",
      ""question"": ""What can I help you with today?"",
      ""variableName"": ""userIntent"",
      ""inputMode"": ""choice"",
      ""options"": [
        {{ ""id"": ""billing"", ""label"": ""Billing"", ""value"": ""billing"" }},
        {{ ""id"": ""support"", ""label"": ""Support"", ""value"": ""support"" }}
      ],
      ""invalidInputMessage"": ""Please choose one of the available options.""
    }}
  }}
- condition node:
  {{
    ""id"": ""condition-1"",
    ""type"": ""condition"",
    ""label"": ""Check Intent"",
    ""position"": {{ ""x"": 120, ""y"": 420 }},
    ""config"": {{
      ""kind"": ""condition"",
      ""variableName"": ""userIntent"",
      ""rules"": [
        {{ ""id"": ""condition-rule-1"", ""operator"": ""equals"", ""value"": ""billing"" }}
      ],
      ""fallbackLabel"": ""Fallback""
    }}
  }}
- variable node:
  {{
    ""id"": ""variable-1"",
    ""type"": ""variable"",
    ""label"": ""Set Customer Name"",
    ""position"": {{ ""x"": 120, ""y"": 540 }},
    ""config"": {{
      ""kind"": ""variable"",
      ""variableName"": ""customerName"",
      ""operation"": ""set"",
      ""value"": ""{{firstName}}"",
      ""sourceVariableName"": """"
    }}
  }}
- api node:
  {{
    ""id"": ""api-1"",
    ""type"": ""api"",
    ""label"": ""Lookup Order"",
    ""position"": {{ ""x"": 120, ""y"": 660 }},
    ""config"": {{
      ""kind"": ""api"",
      ""endpoint"": ""https://api.example.com/orders"",
      ""method"": ""GET"",
      ""headers"": [],
      ""body"": """",
      ""timeoutMs"": 10000,
      ""responseMappings"": [
        {{ ""id"": ""mapping-1"", ""variableName"": ""apiResult"", ""path"": ""body"" }}
      ],
      ""successLabel"": ""Success"",
      ""errorLabel"": ""Error""
    }}
  }}
- ai node:
  {{
    ""id"": ""ai-1"",
    ""type"": ""ai"",
    ""label"": ""AI Answer"",
    ""position"": {{ ""x"": 120, ""y"": 780 }},
    ""config"": {{
      ""kind"": ""ai"",
      ""instructions"": ""Answer the question using the attached knowledge base."",
      ""fallbackText"": ""I'm not confident enough to answer that yet."",
      ""responseMode"": ""strict""
    }}
  }}
- code node:
  {{
    ""id"": ""code-1"",
    ""type"": ""code"",
    ""label"": ""Transform Value"",
    ""position"": {{ ""x"": 120, ""y"": 900 }},
    ""config"": {{
      ""kind"": ""code"",
      ""script"": ""vars.result = vars.userIntent ?? \""\"";"",
      ""timeoutMs"": 1000
    }}
  }}
- handoff node:
  {{
    ""id"": ""handoff-1"",
    ""type"": ""handoff"",
    ""label"": ""Escalate To Support"",
    ""position"": {{ ""x"": 120, ""y"": 1020 }},
    ""config"": {{
      ""kind"": ""handoff"",
      ""inboxKey"": ""support"",
      ""confirmationMessage"": ""Thanks. Our team will review your message and follow up by email."",
      ""contactEmailVariable"": ""email""
    }}
  }}
- end node:
  {{
    ""id"": ""end-1"",
    ""type"": ""end"",
    ""label"": ""Finish"",
    ""position"": {{ ""x"": 120, ""y"": 1140 }},
    ""config"": {{
      ""kind"": ""end"",
      ""closingText"": ""Thanks for chatting with us.""
    }}
  }}

Edge rules:
- Every edge must use this exact shape:
  {{ ""id"": ""edge-1"", ""source"": ""node-a"", ""target"": ""node-b"", ""sourceHandle"": """", ""label"": """" }}
- For normal linear routes, sourceHandle can be omitted or empty.
- Question choice branches must use sourceHandle values in the form option-<optionId>.
- Condition rule branches must use sourceHandle values rule-0, rule-1, and so on, matching rule order.
- Condition fallback must use sourceHandle fallback.
- API nodes should have success and error outgoing edges using sourceHandle success and error.
- Code nodes should have success and error outgoing edges using sourceHandle success and error.

Behavior rules:
- Include exactly one start node.
- Every node must have a unique id.
- Every non-start node should be reachable from the start node.
- Use realistic labels and realistic message text.
- Position nodes top-to-bottom with increasing y values so the graph is readable.
- Prefer simpler nodes first. Only use advanced nodes when the user request clearly needs them.
- Use api only when external data or an external system is clearly needed.
- Use ai only when open-ended flexible answering is clearly intended.
- Use code only when transformation or branching logic cannot be expressed with question, condition, or variable nodes.
- Use handoff only for human escalation flows.
- If you use handoff, add metadata.handoffInboxes with at least one inbox such as {{ ""key"": ""support"", ""label"": ""Support Team"", ""email"": ""support@example.com"" }}.
- If you use handoff, contactEmailVariable must match a variable captured earlier in the graph.
- For api responseMappings, use path ""body"" unless a clearer JSON path is obvious.
- For code nodes, the script must be JavaScript that reads or writes values through vars.<name> or vars[""name""].
- Do not invent fields that are not part of the schema.
- Do not omit required config keys.";
    }
}
