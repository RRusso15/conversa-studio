using Abp.Application.Services;
using conversa-studio.Authorization.Accounts.Dto;
using System.Threading.Tasks;

namespace conversa-studio.Authorization.Accounts;

public interface IAccountAppService : IApplicationService
{
    Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input);

    Task<RegisterOutput> Register(RegisterInput input);
}
