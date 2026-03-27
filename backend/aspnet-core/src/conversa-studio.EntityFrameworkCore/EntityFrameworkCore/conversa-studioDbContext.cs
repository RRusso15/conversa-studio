using System;
using Abp.Zero.EntityFrameworkCore;
using ConversaStudio.Authorization.Roles;
using ConversaStudio.Authorization.Users;
using ConversaStudio.Domains.Bots;
using ConversaStudio.Domains.Deployments;
using ConversaStudio.Domains.Runtime;
using ConversaStudio.Domains.Transcripts;
using ConversaStudio.MultiTenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace ConversaStudio.EntityFrameworkCore;

public class ConversaStudioDbContext : AbpZeroDbContext<Tenant, Role, User, ConversaStudioDbContext>
{
    private static readonly ValueConverter<DateTime, DateTime> UtcDateTimeConverter =
        new(
            value => NormalizeToUtc(value),
            value => DateTime.SpecifyKind(value, DateTimeKind.Utc));

    private static readonly ValueConverter<DateTime?, DateTime?> NullableUtcDateTimeConverter =
        new(
            value => value.HasValue ? NormalizeToUtc(value.Value) : value,
            value => value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : value);

    /// <summary>
    /// Gets or sets the persisted bot definitions.
    /// </summary>
    public DbSet<BotDefinition> BotDefinitions { get; set; }

    /// <summary>
    /// Gets or sets persisted bot deployments.
    /// </summary>
    public DbSet<BotDeployment> BotDeployments { get; set; }

    /// <summary>
    /// Gets or sets persisted runtime sessions.
    /// </summary>
    public DbSet<RuntimeSession> RuntimeSessions { get; set; }

    /// <summary>
    /// Gets or sets persisted transcript messages.
    /// </summary>
    public DbSet<TranscriptMessage> TranscriptMessages { get; set; }

    public ConversaStudioDbContext(DbContextOptions<ConversaStudioDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<BotDefinition>(entity =>
        {
            entity.ToTable("AppBotDefinitions");
            entity.Property(bot => bot.Name).IsRequired().HasMaxLength(BotDefinition.MaxNameLength);
            entity.Property(bot => bot.Status).IsRequired().HasMaxLength(BotDefinition.MaxStatusLength);
            entity.Property(bot => bot.DraftGraphJson).IsRequired();
            entity.Property(bot => bot.PublishedGraphJson);
            entity.HasIndex(bot => new { bot.TenantId, bot.OwnerUserId, bot.CreationTime });
        });

        modelBuilder.Entity<BotDeployment>(entity =>
        {
            entity.ToTable("AppBotDeployments");
            entity.Property(deployment => deployment.Name).IsRequired().HasMaxLength(BotDeployment.MaxNameLength);
            entity.Property(deployment => deployment.ChannelType).IsRequired().HasMaxLength(BotDeployment.MaxChannelTypeLength);
            entity.Property(deployment => deployment.Status).IsRequired().HasMaxLength(BotDeployment.MaxStatusLength);
            entity.Property(deployment => deployment.DeploymentKey).IsRequired().HasMaxLength(BotDeployment.MaxDeploymentKeyLength);
            entity.Property(deployment => deployment.AllowedDomainsJson).IsRequired();
            entity.Property(deployment => deployment.LauncherLabel).IsRequired().HasMaxLength(BotDeployment.MaxLauncherLabelLength);
            entity.Property(deployment => deployment.ThemeColor).IsRequired().HasMaxLength(BotDeployment.MaxThemeColorLength);
            entity.HasIndex(deployment => deployment.DeploymentKey).IsUnique();
            entity.HasIndex(deployment => new { deployment.TenantId, deployment.BotDefinitionId, deployment.CreationTime });
        });

        modelBuilder.Entity<RuntimeSession>(entity =>
        {
            entity.ToTable("AppRuntimeSessions");
            entity.Property(session => session.SessionToken).IsRequired().HasMaxLength(RuntimeSession.MaxSessionTokenLength);
            entity.Property(session => session.CurrentNodeId).HasMaxLength(RuntimeSession.MaxNodeIdLength);
            entity.Property(session => session.PendingQuestionVariable).HasMaxLength(RuntimeSession.MaxNodeIdLength);
            entity.Property(session => session.VariablesJson).IsRequired().HasMaxLength(RuntimeSession.MaxVariablePayloadLength);
            entity.HasIndex(session => session.SessionToken).IsUnique();
            entity.HasIndex(session => new { session.TenantId, session.BotDeploymentId, session.CreationTime });
        });

        modelBuilder.Entity<TranscriptMessage>(entity =>
        {
            entity.ToTable("AppTranscriptMessages");
            entity.Property(message => message.Role).IsRequired().HasMaxLength(TranscriptMessage.MaxRoleLength);
            entity.Property(message => message.Content).IsRequired().HasMaxLength(TranscriptMessage.MaxContentLength);
            entity.HasIndex(message => new { message.TenantId, message.RuntimeSessionId, message.CreationTime });
        });

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(UtcDateTimeConverter);
                }
                else if (property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(NullableUtcDateTimeConverter);
                }
            }
        }
    }

    private static DateTime NormalizeToUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Unspecified => DateTime.SpecifyKind(value, DateTimeKind.Utc),
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => value
        };
    }
}
