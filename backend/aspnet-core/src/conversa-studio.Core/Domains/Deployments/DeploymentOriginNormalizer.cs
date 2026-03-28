using System;

namespace ConversaStudio.Domains.Deployments;

/// <summary>
/// Normalizes deployment allow-list entries and embed origins to comparable origin values.
/// </summary>
public static class DeploymentOriginNormalizer
{
    /// <summary>
    /// Converts a configured deployment domain or request origin into a canonical origin value.
    /// </summary>
    public static string Normalize(string originOrDomain)
    {
        if (string.IsNullOrWhiteSpace(originOrDomain))
        {
            return string.Empty;
        }

        var candidate = originOrDomain.Trim();

        if (!candidate.Contains("://", StringComparison.Ordinal))
        {
            candidate = NeedsHttpScheme(candidate)
                ? $"http://{candidate}"
                : $"https://{candidate}";
        }

        if (!Uri.TryCreate(candidate, UriKind.Absolute, out var uri))
        {
            return string.Empty;
        }

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            return string.Empty;
        }

        var normalizedBuilder = new UriBuilder(uri.Scheme, uri.Host, uri.IsDefaultPort ? -1 : uri.Port)
        {
            Path = string.Empty,
            Query = string.Empty,
            Fragment = string.Empty
        };

        return normalizedBuilder.Uri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
    }

    private static bool NeedsHttpScheme(string candidate)
    {
        return candidate.StartsWith("localhost", StringComparison.OrdinalIgnoreCase) ||
               candidate.StartsWith("127.0.0.1", StringComparison.OrdinalIgnoreCase);
    }
}
