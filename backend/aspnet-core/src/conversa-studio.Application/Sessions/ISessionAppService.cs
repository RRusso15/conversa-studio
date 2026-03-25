using Abp.Application.Services;
using ConversaStudio.Sessions.Dto;
using System.Threading.Tasks;

namespace ConversaStudio.Sessions;

public interface ISessionAppService : IApplicationService
{
    Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations();
}
