using Abp.AspNetCore.Mvc.Controllers;
using Abp.IdentityFramework;
using Microsoft.AspNetCore.Identity;

namespace ConversaStudio.Controllers
{
    public abstract class ConversaStudioControllerBase : AbpController
    {
        protected ConversaStudioControllerBase()
        {
            LocalizationSourceName = ConversaStudioConsts.LocalizationSourceName;
        }

        protected void CheckErrors(IdentityResult identityResult)
        {
            identityResult.CheckErrors(LocalizationManager);
        }
    }
}
