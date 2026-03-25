using Abp.AspNetCore;
using Abp.AspNetCore.TestBase;
using Abp.Modules;
using Abp.Reflection.Extensions;
using ConversaStudio.EntityFrameworkCore;
using ConversaStudio.Web.Startup;
using Microsoft.AspNetCore.Mvc.ApplicationParts;

namespace ConversaStudio.Web.Tests;

[DependsOn(
    typeof(ConversaStudioWebMvcModule),
    typeof(AbpAspNetCoreTestBaseModule)
)]
public class ConversaStudioWebTestModule : AbpModule
{
    public ConversaStudioWebTestModule(ConversaStudioEntityFrameworkModule abpProjectNameEntityFrameworkModule)
    {
        abpProjectNameEntityFrameworkModule.SkipDbContextRegistration = true;
    }

    public override void PreInitialize()
    {
        Configuration.UnitOfWork.IsTransactional = false; //EF Core InMemory DB does not support transactions.
    }

    public override void Initialize()
    {
        IocManager.RegisterAssemblyByConvention(typeof(ConversaStudioWebTestModule).GetAssembly());
    }

    public override void PostInitialize()
    {
        IocManager.Resolve<ApplicationPartManager>()
            .AddApplicationPartsIfNotAddedBefore(typeof(ConversaStudioWebMvcModule).Assembly);
    }
}