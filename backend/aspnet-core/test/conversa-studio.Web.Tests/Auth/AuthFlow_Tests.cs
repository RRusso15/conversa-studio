using Abp.Web.Models;
using ConversaStudio.Authorization.Accounts.Dto;
using ConversaStudio.Authorization.Roles;
using ConversaStudio.Models.TokenAuth;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using System.Net;
using System.Net.Http;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace ConversaStudio.Web.Tests.Auth;

public class AuthFlow_Tests : ConversaStudioWebTestBase
{
    [Fact]
    public async Task Register_Should_Create_Host_User_That_Can_Authenticate()
    {
        var emailAddress = "host.signup@conversa.test";
        var password = "Password1";

        var registerResponse = await Client.PostAsync(
            "/api/services/app/Account/Register",
            new StringContent(
                JsonSerializer.Serialize(
                    new RegisterInput
                    {
                        Name = "Host",
                        Surname = "User",
                        UserName = emailAddress,
                        EmailAddress = emailAddress,
                        Password = password
                    }),
                Encoding.UTF8,
                "application/json"));

        registerResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        var registerPayload = JsonSerializer.Deserialize<AjaxResponse<RegisterOutput>>(
            await registerResponse.Content.ReadAsStringAsync(),
            new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

        registerPayload.ShouldNotBeNull();
        registerPayload.Success.ShouldBeTrue();
        registerPayload.Result.ShouldNotBeNull();
        registerPayload.Result.CanLogin.ShouldBeTrue();

        var authenticateResponse = await Client.PostAsync(
            "/api/TokenAuth/Authenticate",
            new StringContent(
                JsonSerializer.Serialize(
                    new AuthenticateModel
                    {
                        UserNameOrEmailAddress = emailAddress,
                        Password = password,
                        RememberClient = true
                    }),
                Encoding.UTF8,
                "application/json"));

        authenticateResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        var authenticatePayload = JsonSerializer.Deserialize<AjaxResponse<AuthenticateResultModel>>(
            await authenticateResponse.Content.ReadAsStringAsync(),
            new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

        authenticatePayload.ShouldNotBeNull();
        authenticatePayload.Success.ShouldBeTrue();
        authenticatePayload.Result.ShouldNotBeNull();
        authenticatePayload.Result.AccessToken.ShouldNotBeNullOrWhiteSpace();
        authenticatePayload.Result.UserId.ShouldBeGreaterThan(0);

        await UsingDbContextAsync(async context =>
        {
            var createdUser = await context.Users.FindAsync(authenticatePayload.Result.UserId);
            createdUser.ShouldNotBeNull();
            createdUser.TenantId.ShouldBeNull();
        });
    }

    [Fact]
    public async Task Register_Should_Create_Default_Tenant_Developer_Who_Can_Save_Bots()
    {
        Client.DefaultRequestHeaders.Remove("Abp-TenantId");
        Client.DefaultRequestHeaders.Add("Abp-TenantId", "1");

        var emailAddress = "tenant.signup@conversa.test";
        var password = "Password1";

        var registerResponse = await Client.PostAsync(
            "/api/services/app/Account/Register",
            new StringContent(
                JsonSerializer.Serialize(
                    new RegisterInput
                    {
                        Name = "Tenant",
                        Surname = "Developer",
                        UserName = emailAddress,
                        EmailAddress = emailAddress,
                        Password = password
                    }),
                Encoding.UTF8,
                "application/json"));

        registerResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        await AuthenticateAsync(
            Abp.MultiTenancy.AbpTenantBase.DefaultTenantName,
            new AuthenticateModel
            {
                UserNameOrEmailAddress = emailAddress,
                Password = password,
                RememberClient = true
            });

        var createResponse = await Client.PostAsync(
            "/api/services/app/BotDefinition/CreateDraft",
            new StringContent(
                JsonSerializer.Serialize(
                    new ConversaStudio.Services.Bots.Dto.CreateBotDefinitionRequest
                    {
                        Name = "Tenant Developer Bot",
                        Graph = CreateGraph()
                    }),
                Encoding.UTF8,
                "application/json"));

        createResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        await UsingDbContextAsync(async context =>
        {
            var createdUser = await context.Users.SingleAsync(user => user.EmailAddress == emailAddress);
            createdUser.TenantId.ShouldBe(1);

            var roleIds = context.UserRoles
                .Where(userRole => userRole.UserId == createdUser.Id)
                .Select(userRole => userRole.RoleId)
                .ToList();

            var roleNames = context.Roles
                .Where(role => roleIds.Contains(role.Id))
                .Select(role => role.Name)
                .ToList();

            roleNames.ShouldContain(StaticRoleNames.Tenants.Developer);
            roleNames.ShouldNotContain(StaticRoleNames.Tenants.Admin);
        });
    }

    private static ConversaStudio.Services.Bots.Dto.BotGraphDto CreateGraph()
    {
        return new ConversaStudio.Services.Bots.Dto.BotGraphDto
        {
            Metadata = new ConversaStudio.Services.Bots.Dto.BotGraphMetadataDto
            {
                Id = "tenant-developer-bot",
                Name = "Tenant Developer Bot",
                Status = "draft",
                Version = "v1"
            },
            Nodes =
            [
                new ConversaStudio.Services.Bots.Dto.BotNodeDto
                {
                    Id = "start-node",
                    Type = "start",
                    Label = "Start",
                    Position = new ConversaStudio.Services.Bots.Dto.BotNodePositionDto { X = 100, Y = 80 },
                    Config = JsonSerializer.SerializeToElement(new { kind = "start" })
                },
                new ConversaStudio.Services.Bots.Dto.BotNodeDto
                {
                    Id = "message-node",
                    Type = "message",
                    Label = "Hello",
                    Position = new ConversaStudio.Services.Bots.Dto.BotNodePositionDto { X = 100, Y = 220 },
                    Config = JsonSerializer.SerializeToElement(new { kind = "message", message = "Hello." })
                },
                new ConversaStudio.Services.Bots.Dto.BotNodeDto
                {
                    Id = "end-node",
                    Type = "end",
                    Label = "End",
                    Position = new ConversaStudio.Services.Bots.Dto.BotNodePositionDto { X = 100, Y = 360 },
                    Config = JsonSerializer.SerializeToElement(new { kind = "end", closingText = "Bye." })
                }
            ],
            Edges =
            [
                new ConversaStudio.Services.Bots.Dto.BotEdgeDto { Id = "edge-1", Source = "start-node", Target = "message-node", Label = "Next" },
                new ConversaStudio.Services.Bots.Dto.BotEdgeDto { Id = "edge-2", Source = "message-node", Target = "end-node", Label = "Next" }
            ]
        };
    }
}
