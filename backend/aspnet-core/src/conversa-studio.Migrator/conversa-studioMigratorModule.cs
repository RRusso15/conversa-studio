using Abp.Events.Bus;
using Abp.Modules;
using Abp.Reflection.Extensions;
using conversa-studio.Configuration;
using conversa-studio.EntityFrameworkCore;
using conversa-studio.Migrator.DependencyInjection;
using Castle.MicroKernel.Registration;
using Microsoft.Extensions.Configuration;

namespace conversa-studio.Migrator;

[DependsOn(typeof(conversa-studioEntityFrameworkModule))]
public class conversa-studioMigratorModule : AbpModule
{
    private readonly IConfigurationRoot _appConfiguration;

    public conversa-studioMigratorModule(conversa-studioEntityFrameworkModule abpProjectNameEntityFrameworkModule)
    {
        abpProjectNameEntityFrameworkModule.SkipDbSeed = true;

        _appConfiguration = AppConfigurations.Get(
            typeof(conversa-studioMigratorModule).GetAssembly().GetDirectoryPathOrNull()
        );
    }

    public override void PreInitialize()
    {
        Configuration.DefaultNameOrConnectionString = _appConfiguration.GetConnectionString(
            conversa-studioConsts.ConnectionStringName
        );

        Configuration.BackgroundJobs.IsJobExecutionEnabled = false;
        Configuration.ReplaceService(
            typeof(IEventBus),
            () => IocManager.IocContainer.Register(
                Component.For<IEventBus>().Instance(NullEventBus.Instance)
            )
        );
    }

    public override void Initialize()
    {
        IocManager.RegisterAssemblyByConvention(typeof(conversa-studioMigratorModule).GetAssembly());
        ServiceCollectionRegistrar.Register(IocManager);
    }
}
