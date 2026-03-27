using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.UI;
using ConversaStudio.Authorization.Accounts;
using ConversaStudio.Authorization.Accounts.Dto;
using ConversaStudio.Services.Bots;
using ConversaStudio.Services.Bots.Dto;
using ConversaStudio.Authorization;
using ConversaStudio.Authorization.Roles;
using ConversaStudio.Authorization.Users;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;

namespace ConversaStudio.Tests.Bots;

/// <summary>
/// Verifies application-level bot persistence and validation flows.
/// </summary>
public class BotDefinitionAppService_Tests : ConversaStudioTestBase
{
    private readonly IBotDefinitionAppService _botDefinitionAppService;

    public BotDefinitionAppService_Tests()
    {
        _botDefinitionAppService = Resolve<IBotDefinitionAppService>();
    }

    [Fact]
    public async Task CreateDraft_Should_Persist_Tenant_Scoped_Bot()
    {
        var output = await _botDefinitionAppService.CreateDraft(
            new CreateBotDefinitionRequest
            {
                Name = "Support Bot",
                Graph = CreateGraph("new-bot", "Support Bot")
            });

        output.Name.ShouldBe("Support Bot");
        output.Status.ShouldBe("Draft");

        await UsingDbContextAsync(async context =>
        {
            var persistedBot = await context.BotDefinitions.FirstOrDefaultAsync(bot => bot.Id == output.Id);
            persistedBot.ShouldNotBeNull();
            persistedBot.TenantId.ShouldBe(1);
            persistedBot.OwnerUserId.ShouldBe(AbpSession.UserId!.Value);
            persistedBot.DraftVersion.ShouldBe(1);
        });
    }

    [Fact]
    public async Task UpdateDraft_Should_Reject_Invalid_Graph()
    {
        var created = await _botDefinitionAppService.CreateDraft(
            new CreateBotDefinitionRequest
            {
                Name = "Lead Bot",
                Graph = CreateGraph("lead-bot", "Lead Bot")
            });

        await Should.ThrowAsync<UserFriendlyException>(async () =>
            await _botDefinitionAppService.UpdateDraft(
                new UpdateBotDefinitionRequest
                {
                    Id = created.Id,
                    Name = "Lead Bot",
                    Graph = CreateInvalidGraph("lead-bot", "Lead Bot")
                }));
    }

    [Fact]
    public async Task GetBots_Should_Return_Only_Current_Tenant_User_Bots()
    {
        var currentUserId = AbpSession.UserId!.Value;
        var hostAdminId = UsingDbContext(context => context.Users.Single(user => user.TenantId == null && user.UserName == "admin").Id);

        await UsingDbContextAsync(async context =>
        {
            await context.BotDefinitions.AddAsync(
                new Domains.Bots.BotDefinition(Guid.NewGuid(), 1, currentUserId, "Tenant Bot", Serialize(CreateGraph("tenant-bot", "Tenant Bot"))));
            await context.BotDefinitions.AddAsync(
                new Domains.Bots.BotDefinition(Guid.NewGuid(), null, hostAdminId, "Host Bot", Serialize(CreateGraph("host-bot", "Host Bot"))));
        });

        var output = await _botDefinitionAppService.GetBots();

        output.Items.Count.ShouldBe(1);
        output.Items.Single().Name.ShouldBe("Tenant Bot");
    }

    [Fact]
    public async Task ValidateDraft_Should_Return_Blocking_Issues()
    {
        var output = await _botDefinitionAppService.ValidateDraft(
            new ValidateBotDefinitionRequest
            {
                Graph = CreateInvalidGraph("broken-bot", "Broken Bot")
            });

        output.Items.ShouldContain(result => result.Severity == "error");
    }

    [Fact]
    public async Task Registered_Tenant_Developer_Should_Inherit_Bot_Permission_Without_Admin_Role()
    {
        LoginAsHostAdmin();
        var tenantId = UsingDbContext(context => context.Tenants.Single(tenant => tenant.TenancyName == Abp.MultiTenancy.AbpTenantBase.DefaultTenantName).Id);

        User createdUser = null;

        using (UsingTenantId(tenantId))
        {
            var accountAppService = Resolve<IAccountAppService>();
            await accountAppService.Register(new RegisterInput
            {
                Name = "Tenant",
                Surname = "Developer",
                EmailAddress = "developer.permission@conversa.test",
                UserName = "developer.permission@conversa.test",
                Password = "Password1"
            });
        }

        createdUser = await UsingDbContextAsync(async context =>
            await context.Users.SingleAsync(user => user.EmailAddress == "developer.permission@conversa.test"));

        createdUser.ShouldNotBeNull();

        await UsingDbContextAsync(async context =>
        {
            var roleIds = await context.UserRoles
                .Where(userRole => userRole.UserId == createdUser.Id)
                .Select(userRole => userRole.RoleId)
                .ToListAsync();

            var roles = await context.Roles
                .Where(role => roleIds.Contains(role.Id))
                .Select(role => role.Name)
                .ToListAsync();

            roles.ShouldContain(StaticRoleNames.Tenants.Developer);
            roles.ShouldNotContain(StaticRoleNames.Tenants.Admin);
        });

        LoginAsTenant(Abp.MultiTenancy.AbpTenantBase.DefaultTenantName, createdUser.UserName);
        var permissionChecker = Resolve<IPermissionChecker>();
        (await permissionChecker.IsGrantedAsync(PermissionNames.Pages_Bots)).ShouldBeTrue();
    }

    private static BotGraphDto CreateGraph(string id, string name)
    {
        return new BotGraphDto
        {
            Metadata = new BotGraphMetadataDto
            {
                Id = id,
                Name = name,
                Status = "draft",
                Version = "v1"
            },
            Nodes =
            [
                new BotNodeDto
                {
                    Id = "start-node",
                    Type = "start",
                    Label = "Start",
                    Position = new BotNodePositionDto { X = 120, Y = 80 },
                    Config = JsonSerializer.SerializeToElement(new { kind = "start" })
                },
                new BotNodeDto
                {
                    Id = "message-node",
                    Type = "message",
                    Label = "Welcome",
                    Position = new BotNodePositionDto { X = 120, Y = 220 },
                    Config = JsonSerializer.SerializeToElement(new { kind = "message", message = "Hello there." })
                },
                new BotNodeDto
                {
                    Id = "end-node",
                    Type = "end",
                    Label = "End",
                    Position = new BotNodePositionDto { X = 120, Y = 380 },
                    Config = JsonSerializer.SerializeToElement(new { kind = "end", closingText = "Bye." })
                }
            ],
            Edges =
            [
                new BotEdgeDto { Id = "edge-1", Source = "start-node", Target = "message-node", Label = "Next" },
                new BotEdgeDto { Id = "edge-2", Source = "message-node", Target = "end-node", Label = "Next" }
            ]
        };
    }

    private static BotGraphDto CreateInvalidGraph(string id, string name)
    {
        return new BotGraphDto
        {
            Metadata = new BotGraphMetadataDto
            {
                Id = id,
                Name = name,
                Status = "draft",
                Version = "v1"
            },
            Nodes =
            [
                new BotNodeDto
                {
                    Id = "message-node",
                    Type = "message",
                    Label = "Welcome",
                    Position = new BotNodePositionDto { X = 120, Y = 220 },
                    Config = JsonSerializer.SerializeToElement(new { kind = "message", message = "" })
                }
            ],
            Edges = []
        };
    }

    private static string Serialize(BotGraphDto graph)
    {
        return JsonSerializer.Serialize(graph, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
    }
}
