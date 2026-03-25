using Abp.Zero.EntityFrameworkCore;
using ConversaStudio.Authorization.Roles;
using ConversaStudio.Authorization.Users;
using ConversaStudio.MultiTenancy;
using Microsoft.EntityFrameworkCore;

namespace ConversaStudio.EntityFrameworkCore;

public class ConversaStudioDbContext : AbpZeroDbContext<Tenant, Role, User, ConversaStudioDbContext>
{
    /* Define a DbSet for each entity of the application */

    public ConversaStudioDbContext(DbContextOptions<ConversaStudioDbContext> options)
        : base(options)
    {
    }
}
