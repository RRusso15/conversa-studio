using Abp.Authorization;
using ConversaStudio.Authorization.Roles;
using ConversaStudio.Authorization.Users;

namespace ConversaStudio.Authorization;

public class PermissionChecker : PermissionChecker<Role, User>
{
    public PermissionChecker(UserManager userManager)
        : base(userManager)
    {
    }
}
