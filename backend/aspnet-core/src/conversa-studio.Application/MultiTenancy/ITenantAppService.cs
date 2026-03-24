using Abp.Application.Services;
using conversa-studio.MultiTenancy.Dto;

namespace conversa-studio.MultiTenancy;

public interface ITenantAppService : IAsyncCrudAppService<TenantDto, int, PagedTenantResultRequestDto, CreateTenantDto, TenantDto>
{
}

