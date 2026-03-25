using Abp.AutoMapper;
using Abp.Modules;
using Abp.Reflection.Extensions;
using ConversaStudio.Authorization;

namespace ConversaStudio;

[DependsOn(
    typeof(ConversaStudioCoreModule),
    typeof(AbpAutoMapperModule))]
public class ConversaStudioApplicationModule : AbpModule
{
    public override void PreInitialize()
    {
        Configuration.Authorization.Providers.Add<ConversaStudioAuthorizationProvider>();
    }

    public override void Initialize()
    {
        var thisAssembly = typeof(ConversaStudioApplicationModule).GetAssembly();

        IocManager.RegisterAssemblyByConvention(thisAssembly);

        Configuration.Modules.AbpAutoMapper().Configurators.Add(
            // Scan the assembly for classes which inherit from AutoMapper.Profile
            cfg => cfg.AddMaps(thisAssembly)
        );
    }
}
