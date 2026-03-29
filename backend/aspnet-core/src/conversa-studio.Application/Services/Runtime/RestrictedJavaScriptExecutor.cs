using System;
using System.Collections.Generic;
using System.Text.Json;
using Abp.Dependency;
using Jint;

namespace ConversaStudio.Services.Runtime;

/// <summary>
/// Executes builder-authored JavaScript against a mutable variable bag in a restricted engine.
/// </summary>
public class RestrictedJavaScriptExecutor : ITransientDependency
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    /// <summary>
    /// Executes the provided script and returns the mutated variables dictionary.
    /// </summary>
    public Dictionary<string, string> Execute(string script, IReadOnlyDictionary<string, string> variables, int timeoutMs)
    {
        var serializedVariables = JsonSerializer.Serialize(variables, JsonOptions);
        var engine = new Engine(options =>
        {
            options.Strict();
            options.TimeoutInterval(TimeSpan.FromMilliseconds(timeoutMs));
            options.MaxStatements(10_000);
        });

        engine.SetValue("__varsJson", serializedVariables);
        engine.Execute(@"
const vars = JSON.parse(__varsJson);
const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const toString = (value) => value == null ? '' : String(value);
const isEmpty = (value) => value == null || String(value).trim().length === 0;
const interpolate = (template) => String(template ?? '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => toString(vars[key] ?? ''));
");
        engine.Execute(script ?? string.Empty);
        var mutatedVariablesJson = engine.Evaluate("JSON.stringify(vars)").AsString();
        var serializedVariablesMap = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(mutatedVariablesJson, JsonOptions)
                                   ?? new Dictionary<string, JsonElement>(StringComparer.OrdinalIgnoreCase);
        var normalizedVariables = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var pair in serializedVariablesMap)
        {
            normalizedVariables[pair.Key] = ConvertJsonElementToString(pair.Value);
        }

        return normalizedVariables;
    }

    private static string ConvertJsonElementToString(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.String => element.GetString() ?? string.Empty,
            JsonValueKind.Number => element.ToString(),
            JsonValueKind.True => bool.TrueString.ToLowerInvariant(),
            JsonValueKind.False => bool.FalseString.ToLowerInvariant(),
            JsonValueKind.Null => string.Empty,
            _ => element.ToString()
        };
    }
}
