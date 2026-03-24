using conversa-studio.Models.TokenAuth;
using conversa-studio.Web.Controllers;
using Shouldly;
using System.Threading.Tasks;
using Xunit;

namespace conversa-studio.Web.Tests.Controllers;

public class HomeController_Tests : conversa-studioWebTestBase
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