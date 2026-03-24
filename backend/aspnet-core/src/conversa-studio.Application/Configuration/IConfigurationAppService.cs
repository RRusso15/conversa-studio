using conversa-studio.Configuration.Dto;
using System.Threading.Tasks;

namespace conversa-studio.Configuration;

public interface IConfigurationAppService
{
    Task ChangeUiTheme(ChangeUiThemeInput input);
}
