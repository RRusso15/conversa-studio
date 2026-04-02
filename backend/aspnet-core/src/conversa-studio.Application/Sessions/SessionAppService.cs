using Abp.Auditing;
using ConversaStudio.Sessions.Dto;
using ConversaStudio.Authorization.Users;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ConversaStudio.Sessions;

public class SessionAppService : ConversaStudioAppServiceBase, ISessionAppService
{
    private readonly UserManager _userManager;

    public SessionAppService(UserManager userManager)
    {
        _userManager = userManager;
    }

    [DisableAuditing]
    public async Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations()
    {
        var output = new GetCurrentLoginInformationsOutput
        {
            Application = new ApplicationInfoDto
            {
                Version = AppVersionHelper.Version,
                ReleaseDate = AppVersionHelper.ReleaseDate,
                Features = new Dictionary<string, bool>()
            }
        };

        if (AbpSession.TenantId.HasValue)
        {
            output.Tenant = ObjectMapper.Map<TenantLoginInfoDto>(await GetCurrentTenantAsync());
        }

        if (AbpSession.UserId.HasValue)
        {
            var user = await GetCurrentUserAsync();
            var userDto = ObjectMapper.Map<UserLoginInfoDto>(user);
            userDto.RoleNames = (await _userManager.GetRolesAsync(user)).ToArray();
            output.User = userDto;
        }

        return output;
    }
}
