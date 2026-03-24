using Abp.Authorization;
using conversa-studio.Authorization.Roles;
using conversa-studio.Authorization.Users;

namespace conversa-studio.Authorization;

public class PermissionChecker : PermissionChecker<Role, User>
{
    public PermissionChecker(UserManager userManager)
        : base(userManager)
    {
    }
}
