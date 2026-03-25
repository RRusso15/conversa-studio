using Microsoft.EntityFrameworkCore;
using System.Data.Common;

namespace ConversaStudio.EntityFrameworkCore;

public static class ConversaStudioDbContextConfigurer
{
    public static void Configure(DbContextOptionsBuilder<ConversaStudioDbContext> builder, string connectionString)
    {
        builder.UseSqlServer(connectionString);
    }

    public static void Configure(DbContextOptionsBuilder<ConversaStudioDbContext> builder, DbConnection connection)
    {
        builder.UseSqlServer(connection);
    }
}
