using Abp.AspNetCore;
using Abp.AspNetCore.TestBase;
using Abp.Modules;
using Abp.Reflection.Extensions;
using conversa-studio.EntityFrameworkCore;
using conversa-studio.Web.Startup;
using Microsoft.AspNetCore.Mvc.ApplicationParts;

namespace conversa-studio.Web.Tests;

[DependsOn(
    typeof(conversa-studioWebMvcModule),
    typeof(AbpAspNetCoreTestBaseModule)
)]
public class conversa-studioWebTestModule : AbpModule
{
    public conversa-studioWebTestModule(conversa-studioEntityFrameworkModule abpProjectNameEntityFrameworkModule)
    {
        abpProjectNameEntityFrameworkModule.SkipDbContextRegistration = true;
    }

    public override void PreInitialize()
    {
        Configuration.UnitOfWork.IsTransactional = false; //EF Core InMemory DB does not support transactions.
    }

    public override void Initialize()
    {
        IocManager.RegisterAssemblyByConvention(typeof(conversa-studioWebTestModule).GetAssembly());
    }

    public override void PostInitialize()
    {
        IocManager.Resolve<ApplicationPartManager>()
            .AddApplicationPartsIfNotAddedBefore(typeof(conversa-studioWebMvcModule).Assembly);
    }
}