using Microsoft.EntityFrameworkCore;
using System.Data.Common;

namespace conversa-studio.EntityFrameworkCore;

public static class conversa-studioDbContextConfigurer
{
    public static void Configure(DbContextOptionsBuilder<conversa-studioDbContext> builder, string connectionString)
    {
        builder.UseSqlServer(connectionString);
    }

    public static void Configure(DbContextOptionsBuilder<conversa-studioDbContext> builder, DbConnection connection)
    {
        builder.UseSqlServer(connection);
    }
}
