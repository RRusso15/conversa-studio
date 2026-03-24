using Abp.Application.Features;
using Abp.Domain.Repositories;
using Abp.MultiTenancy;
using conversa-studio.Authorization.Users;
using conversa-studio.Editions;

namespace conversa-studio.MultiTenancy;

public class TenantManager : AbpTenantManager<Tenant, User>
{
    public TenantManager(
        IRepository<Tenant> tenantRepository,
        IRepository<TenantFeatureSetting, long> tenantFeatureRepository,
        EditionManager editionManager,
        IAbpZeroFeatureValueStore featureValueStore)
        : base(
            tenantRepository,
            tenantFeatureRepository,
            editionManager,
            featureValueStore)
    {
    }
}
