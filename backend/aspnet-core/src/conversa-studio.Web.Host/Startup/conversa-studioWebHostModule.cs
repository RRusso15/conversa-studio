using Abp.Modules;
using Abp.Reflection.Extensions;
using ConversaStudio.Configuration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace ConversaStudio.Web.Host.Startup
{
    [DependsOn(
       typeof(ConversaStudioWebCoreModule))]
    public class ConversaStudioWebHostModule : AbpModule
    {
        private readonly IWebHostEnvironment _env;
        private readonly IConfigurationRoot _appConfiguration;

        public ConversaStudioWebHostModule(IWebHostEnvironment env)
        {
            _env = env;
            _appConfiguration = env.GetAppConfiguration();
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(ConversaStudioWebHostModule).GetAssembly());
        }
    }
}
