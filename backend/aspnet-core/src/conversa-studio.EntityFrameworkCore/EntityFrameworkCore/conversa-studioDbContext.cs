using System;
using Abp.Zero.EntityFrameworkCore;
using ConversaStudio.Authorization.Roles;
using ConversaStudio.Authorization.Users;
using ConversaStudio.Domains.Bots;
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
