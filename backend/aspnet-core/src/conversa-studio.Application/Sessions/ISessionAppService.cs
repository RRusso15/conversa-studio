using Abp.Application.Services;
using conversa-studio.Sessions.Dto;
using System.Threading.Tasks;

namespace conversa-studio.Sessions;

public interface ISessionAppService : IApplicationService
{
    Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations();
}
