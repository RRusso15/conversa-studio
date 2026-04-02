using Abp.Authorization;
using Abp.Configuration;
using Abp.Zero.Configuration;
using ConversaStudio.Authorization.Accounts.Dto;
using ConversaStudio.Authorization.Users;
using ConversaStudio.Users.Dto;
using Microsoft.AspNetCore.Identity;
using System.Threading.Tasks;

namespace ConversaStudio.Authorization.Accounts;

public class AccountAppService : ConversaStudioAppServiceBase, IAccountAppService
{
    // from: http://regexlib.com/REDetails.aspx?regexp_id=1923
    public const string PasswordRegex = "(?=^.{8,}$)(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\\s)[0-9a-zA-Z!@#$%^&*()]*$";

    private readonly UserRegistrationManager _userRegistrationManager;

    public AccountAppService(
        UserRegistrationManager userRegistrationManager)
    {
        _userRegistrationManager = userRegistrationManager;
    }

    public async Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input)
    {
        var tenant = await TenantManager.FindByTenancyNameAsync(input.TenancyName);
        if (tenant == null)
        {
            return new IsTenantAvailableOutput(TenantAvailabilityState.NotFound);
        }

        if (!tenant.IsActive)
        {
            return new IsTenantAvailableOutput(TenantAvailabilityState.InActive);
        }

        return new IsTenantAvailableOutput(TenantAvailabilityState.Available, tenant.Id);
    }

    public async Task<RegisterOutput> Register(RegisterInput input)
    {
        var user = await _userRegistrationManager.RegisterAsync(
            input.Name,
            input.Surname,
            input.EmailAddress,
            input.UserName,
            input.Password,
            true // Assumed email address is always confirmed. Change this if you want to implement email confirmation.
        );

        var isEmailConfirmationRequiredForLogin = await SettingManager.GetSettingValueAsync<bool>(AbpZeroSettingNames.UserManagement.IsEmailConfirmationRequiredForLogin);

        return new RegisterOutput
        {
            CanLogin = user.IsActive && (user.IsEmailConfirmed || !isEmailConfirmationRequiredForLogin)
        };
    }

    /// <summary>
    /// Changes the current authenticated user's password.
    /// </summary>
    [AbpAuthorize]
    public async Task<bool> ChangePassword(ChangePasswordDto input)
    {
        await UserManager.InitializeOptionsAsync(AbpSession.TenantId);

        var user = await GetCurrentUserAsync();
        if (await UserManager.CheckPasswordAsync(user, input.CurrentPassword))
        {
            CheckErrors(await UserManager.ChangePasswordAsync(user, input.NewPassword));
            return true;
        }

        CheckErrors(IdentityResult.Failed(new IdentityError
        {
            Description = "Incorrect password."
        }));

        return false;
    }
}
