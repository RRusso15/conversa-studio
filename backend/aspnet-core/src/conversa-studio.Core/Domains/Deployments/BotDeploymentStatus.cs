namespace ConversaStudio.Domains.Deployments;

/// <summary>
/// Defines persisted deployment lifecycle states.
/// </summary>
public static class BotDeploymentStatus
{
    public const string Draft = "Draft";
    public const string Active = "Active";
    public const string Inactive = "Inactive";
}
