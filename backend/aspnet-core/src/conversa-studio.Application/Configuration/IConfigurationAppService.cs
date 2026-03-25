using ConversaStudio.Configuration.Dto;
using System.Threading.Tasks;

namespace ConversaStudio.Configuration;

public interface IConfigurationAppService
{
    Task ChangeUiTheme(ChangeUiThemeInput input);
}
