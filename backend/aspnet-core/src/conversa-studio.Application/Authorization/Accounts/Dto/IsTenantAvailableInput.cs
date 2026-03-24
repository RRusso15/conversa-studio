using Abp.MultiTenancy;
using System.ComponentModel.DataAnnotations;

namespace conversa-studio.Authorization.Accounts.Dto;

public class IsTenantAvailableInput
{
    [Required]
    [StringLength(AbpTenantBase.MaxTenancyNameLength)]
    public string TenancyName { get; set; }
}
