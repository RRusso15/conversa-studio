using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Abp.Web.Models;
using ConversaStudio.Models.TokenAuth;
using ConversaStudio.Services.Bots.Dto;
using Shouldly;
using Xunit;

namespace ConversaStudio.Web.Tests.Bots;

/// <summary>
/// Verifies authenticated bot creation and retrieval through the HTTP layer.
/// </summary>
public class BotDefinition_Tests : ConversaStudioWebTestBase
{
    [Fact]
    public async Task Create_And_Get_Bot_Should_Work_For_Authenticated_Tenant_User()
    {
        Client.DefaultRequestHeaders.Remove("Abp-TenantId");
        Client.DefaultRequestHeaders.Add("Abp-TenantId", "1");

        var authenticationResponse = await Client.PostAsync(
            "/api/TokenAuth/Authenticate",
            new StringContent(
                JsonSerializer.Serialize(
                    new AuthenticateModel
                    {
                        UserNameOrEmailAddress = "admin",
                        Password = "123qwe",
                        RememberClient = true
                    }),
                Encoding.UTF8,
                "application/json"));

        authenticationResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        var authenticationPayload = JsonSerializer.Deserialize<AjaxResponse<AuthenticateResultModel>>(
            await authenticationResponse.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        authenticationPayload.ShouldNotBeNull();
        authenticationPayload.Result.ShouldNotBeNull();

        Client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", authenticationPayload.Result.AccessToken);

        var createResponse = await Client.PostAsync(
            "/api/services/app/BotDefinition/CreateDraft",
            new StringContent(
                JsonSerializer.Serialize(
                    new CreateBotDefinitionRequest
                    {
                        Name = "HTTP Bot",
                        Graph = CreateGraph()
                    }),
                Encoding.UTF8,
                "application/json"));

        createResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        var createPayload = JsonSerializer.Deserialize<AjaxResponse<BotDefinitionDto>>(
            await createResponse.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        createPayload.ShouldNotBeNull();
        createPayload.Success.ShouldBeTrue();
        createPayload.Result.ShouldNotBeNull();

        var getResponse = await Client.GetAsync($"/api/services/app/BotDefinition/GetBot?Id={createPayload.Result.Id}");
        getResponse.StatusCode.ShouldBe(HttpStatusCode.OK);

        var getPayload = JsonSerializer.Deserialize<AjaxResponse<BotDefinitionDto>>(
            await getResponse.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        getPayload.ShouldNotBeNull();
        getPayload.Success.ShouldBeTrue();
        getPayload.Result.ShouldNotBeNull();
        getPayload.Result.Name.ShouldBe("HTTP Bot");
    }

    private static BotGraphDto CreateGraph()
    {
        return new BotGraphDto
        {
            Metadata = new BotGraphMetadataDto
            {
                Id = "http-bot",
                Name = "HTTP Bot",
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
                    Label = "Message",
                    Position = new BotNodePositionDto { X = 120, Y = 220 },
                    Config = JsonSerializer.SerializeToElement(new { kind = "message", message = "Hello from HTTP." })
                },
                new BotNodeDto
                {
                    Id = "end-node",
                    Type = "end",
                    Label = "End",
                    Position = new BotNodePositionDto { X = 120, Y = 380 },
                    Config = JsonSerializer.SerializeToElement(new { kind = "end", closingText = "Done." })
                }
            ],
            Edges =
            [
                new BotEdgeDto { Id = "edge-1", Source = "start-node", Target = "message-node", Label = "Next" },
                new BotEdgeDto { Id = "edge-2", Source = "message-node", Target = "end-node", Label = "Next" }
            ]
        };
    }
}
