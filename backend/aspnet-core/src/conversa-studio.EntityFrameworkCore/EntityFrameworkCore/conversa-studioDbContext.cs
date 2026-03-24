using Abp.Zero.EntityFrameworkCore;
using conversa-studio.Authorization.Roles;
using conversa-studio.Authorization.Users;
using conversa-studio.MultiTenancy;
using Microsoft.EntityFrameworkCore;

namespace conversa-studio.EntityFrameworkCore;

public class conversa-studioDbContext : AbpZeroDbContext<Tenant, Role, User, conversa-studioDbContext>
{
    /* Define a DbSet for each entity of the application */

    public conversa-studioDbContext(DbContextOptions<conversa-studioDbContext> options)
        : base(options)
    {
    }
}
