using Abp.Modules;
using Abp.Reflection.Extensions;
using conversa-studio.Configuration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace conversa-studio.Web.Host.Startup
{
    [DependsOn(
       typeof(conversa-studioWebCoreModule))]
    public class conversa-studioWebHostModule : AbpModule
    {
        private readonly IWebHostEnvironment _env;
        private readonly IConfigurationRoot _appConfiguration;

        public conversa-studioWebHostModule(IWebHostEnvironment env)
        {
            _env = env;
            _appConfiguration = env.GetAppConfiguration();
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(conversa-studioWebHostModule).GetAssembly());
        }
    }
}
