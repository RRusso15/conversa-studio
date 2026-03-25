using Abp.Application.Services;
using ConversaStudio.MultiTenancy.Dto;

namespace ConversaStudio.MultiTenancy;

public interface ITenantAppService : IAsyncCrudAppService<TenantDto, int, PagedTenantResultRequestDto, CreateTenantDto, TenantDto>
{
}

