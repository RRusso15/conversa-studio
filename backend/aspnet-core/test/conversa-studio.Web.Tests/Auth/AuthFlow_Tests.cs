using Abp.Web.Models;
using ConversaStudio.Authorization.Accounts.Dto;
using ConversaStudio.Models.TokenAuth;
using Shouldly;
using System.Net;
using System.Net.Http;
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
}
