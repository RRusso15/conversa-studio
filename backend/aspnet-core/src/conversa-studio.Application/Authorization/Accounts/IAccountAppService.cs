using Abp.Application.Services;
using ConversaStudio.Authorization.Accounts.Dto;
using ConversaStudio.Users.Dto;
using System.Threading.Tasks;

namespace ConversaStudio.Authorization.Accounts;

/// <summary>
/// Defines account workflows used during tenant resolution, registration, and self-service account actions.
/// </summary>
public interface IAccountAppService : IApplicationService
{
    /// <summary>
    /// Checks whether the requested tenant is available for sign-in and registration.
    /// </summary>
    Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input);

    /// <summary>
    /// Registers a new user inside the resolved tenant.
    /// </summary>
    Task<RegisterOutput> Register(RegisterInput input);

    /// <summary>
    /// Changes the current authenticated user's password.
    /// </summary>
    Task<bool> ChangePassword(ChangePasswordDto input);
}
