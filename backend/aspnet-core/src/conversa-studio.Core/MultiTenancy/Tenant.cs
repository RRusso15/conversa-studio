using Abp.MultiTenancy;
using ConversaStudio.Authorization.Users;

namespace ConversaStudio.MultiTenancy;

public class Tenant : AbpTenant<User>
{
    public Tenant()
    {
    }

    public Tenant(string tenancyName, string name)
        : base(tenancyName, name)
    {
    }
}
