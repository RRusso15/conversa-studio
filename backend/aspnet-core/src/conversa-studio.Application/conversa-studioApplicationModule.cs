using Abp.AutoMapper;
using Abp.Modules;
using Abp.Reflection.Extensions;
using conversa-studio.Authorization;

namespace conversa-studio;

[DependsOn(
    typeof(conversa-studioCoreModule),
    typeof(AbpAutoMapperModule))]
public class conversa-studioApplicationModule : AbpModule
{
    public override void PreInitialize()
    {
        Configuration.Authorization.Providers.Add<conversa-studioAuthorizationProvider>();
    }

    public override void Initialize()
    {
        var thisAssembly = typeof(conversa-studioApplicationModule).GetAssembly();

        IocManager.RegisterAssemblyByConvention(thisAssembly);

        Configuration.Modules.AbpAutoMapper().Configurators.Add(
            // Scan the assembly for classes which inherit from AutoMapper.Profile
            cfg => cfg.AddMaps(thisAssembly)
        );
    }
}
