using Abp.AspNetCore.Mvc.Controllers;
using Abp.IdentityFramework;
using Microsoft.AspNetCore.Identity;

namespace conversa-studio.Controllers
{
    public abstract class conversa-studioControllerBase : AbpController
    {
        protected conversa-studioControllerBase()
        {
            LocalizationSourceName = conversa-studioConsts.LocalizationSourceName;
        }

        protected void CheckErrors(IdentityResult identityResult)
        {
            identityResult.CheckErrors(LocalizationManager);
        }
    }
}
