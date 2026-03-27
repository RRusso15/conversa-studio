using Abp.AspNetCore;
using Abp.AspNetCore.TestBase;
using Abp.Dependency;
using ConversaStudio.Authentication.JwtBearer;
using ConversaStudio.Configuration;
using ConversaStudio.EntityFrameworkCore;
using ConversaStudio.Identity;
using ConversaStudio.Web.Host.Startup;
using Castle.MicroKernel.Registration;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;

namespace ConversaStudio.Web.Tests;

public class Startup
{
    private readonly IConfigurationRoot _appConfiguration;

    public Startup(IWebHostEnvironment env)
    {
        _appConfiguration = env.GetAppConfiguration();
    }

    public IServiceProvider ConfigureServices(IServiceCollection services)
    {
        services.AddEntityFrameworkInMemoryDatabase();

        services.AddMvc();
        services.AddAntiforgery();

        IdentityRegistrar.Register(services);
        AuthConfigurer.Configure(services, _appConfiguration);

        //Configure Abp and Dependency Injection
        return services.AddAbp<ConversaStudioWebTestModule>(options =>
        {
            options.SetupTest();
        });
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILoggerFactory loggerFactory)
    {
        UseInMemoryDb(app.ApplicationServices);

        app.UseAbp(); //Initializes ABP framework.

        app.UseExceptionHandler("/Error");

        app.UseStaticFiles();
        app.UseRouting();

        app.UseAuthentication();

        app.UseJwtTokenMiddleware();

        app.UseAuthorization();

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}");
        });
    }

    private void UseInMemoryDb(IServiceProvider serviceProvider)
    {
        var builder = new DbContextOptionsBuilder<ConversaStudioDbContext>();
        builder.UseInMemoryDatabase(Guid.NewGuid().ToString()).UseInternalServiceProvider(serviceProvider);
        var options = builder.Options;

        var iocManager = serviceProvider.GetRequiredService<IIocManager>();
        iocManager.IocContainer
            .Register(
                Component.For<DbContextOptions<ConversaStudioDbContext>>()
                    .Instance(options)
                    .LifestyleSingleton()
            );
    }
}
