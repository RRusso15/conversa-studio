namespace ConversaStudio.Services.Deployments.Dto;

/// <summary>
/// Represents an embeddable widget install snippet.
/// </summary>
public class DeploymentSnippetDto
{
    /// <summary>
    /// Gets or sets the public deployment key.
    /// </summary>
    public string DeploymentKey { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the install snippet.
    /// </summary>
    public string Snippet { get; set; } = string.Empty;
}
