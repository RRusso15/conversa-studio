using Abp.Authorization;
using Abp.Runtime.Session;
using ConversaStudio.Configuration.Dto;
using System.Threading.Tasks;

namespace ConversaStudio.Configuration;

[AbpAuthorize]
public class ConfigurationAppService : ConversaStudioAppServiceBase, IConfigurationAppService
{
    public async Task ChangeUiTheme(ChangeUiThemeInput input)
    {
        await SettingManager.ChangeSettingForUserAsync(AbpSession.ToUserIdentifier(), AppSettingNames.UiTheme, input.Theme);
    }
}
