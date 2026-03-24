using Abp.Authorization;
using Abp.Runtime.Session;
using conversa-studio.Configuration.Dto;
using System.Threading.Tasks;

namespace conversa-studio.Configuration;

[AbpAuthorize]
public class ConfigurationAppService : conversa-studioAppServiceBase, IConfigurationAppService
{
    public async Task ChangeUiTheme(ChangeUiThemeInput input)
    {
        await SettingManager.ChangeSettingForUserAsync(AbpSession.ToUserIdentifier(), AppSettingNames.UiTheme, input.Theme);
    }
}
