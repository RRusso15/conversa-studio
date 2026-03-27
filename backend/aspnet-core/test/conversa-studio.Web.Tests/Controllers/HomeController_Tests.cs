using ConversaStudio.Models.TokenAuth;
using ConversaStudio.Web.Host.Controllers;
using Shouldly;
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
        var response = await GetResponseAsStringAsync(
            GetUrl<HomeController>(nameof(HomeController.Index))
        );

        //Assert
        response.ShouldNotBeNullOrEmpty();
    }
}
