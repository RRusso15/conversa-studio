using Abp.Events.Bus;
using Abp.Modules;
using Abp.Reflection.Extensions;
using ConversaStudio.Configuration;
using ConversaStudio.EntityFrameworkCore;
using ConversaStudio.Migrator.DependencyInjection;
using Castle.MicroKernel.Registration;
using Microsoft.Extensions.Configuration;

namespace ConversaStudio.Migrator;

[DependsOn(typeof(ConversaStudioEntityFrameworkModule))]
public class ConversaStudioMigratorModule : AbpModule
{
    private readonly IConfigurationRoot _appConfiguration;

    public ConversaStudioMigratorModule(ConversaStudioEntityFrameworkModule abpProjectNameEntityFrameworkModule)
    {
        abpProjectNameEntityFrameworkModule.SkipDbSeed = true;

        _appConfiguration = AppConfigurations.Get(
            typeof(ConversaStudioMigratorModule).GetAssembly().GetDirectoryPathOrNull()
        );
    }

    public override void PreInitialize()
    {
        Configuration.DefaultNameOrConnectionString = _appConfiguration.GetConnectionString(
            ConversaStudioConsts.ConnectionStringName
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
        IocManager.RegisterAssemblyByConvention(typeof(ConversaStudioMigratorModule).GetAssembly());
        ServiceCollectionRegistrar.Register(IocManager);
    }
}
