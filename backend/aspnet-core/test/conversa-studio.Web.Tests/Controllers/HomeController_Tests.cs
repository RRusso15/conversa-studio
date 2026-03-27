using ConversaStudio.Models.TokenAuth;
using ConversaStudio.Web.Host.Controllers;
using Shouldly;
using System.Net;
using System.Threading.Tasks;
using Xunit;

namespace ConversaStudio.Web.Tests.Controllers;

public class HomeController_Tests : ConversaStudioWebTestBase
{
    [Fact]
    public async Task Index_Test()
    {
        await AuthenticateAsync(null, new AuthenticateModel
        {
            UserNameOrEmailAddress = "admin",
            Password = "123qwe"
        });

        //Act
        var response = await GetResponseAsync(
            GetUrl<HomeController>(nameof(HomeController.Index)),
            HttpStatusCode.Found
        );

        //Assert
        response.Headers.Location.ShouldNotBeNull();
        response.Headers.Location.ToString().ShouldBe("/swagger");
    }
}
