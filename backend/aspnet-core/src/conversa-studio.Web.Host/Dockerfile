FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src
COPY ["src/conversa-studio.Web.Host/conversa-studio.Web.Host.csproj", "src/conversa-studio.Web.Host/"]
COPY ["src/conversa-studio.Web.Core/conversa-studio.Web.Core.csproj", "src/conversa-studio.Web.Core/"]
COPY ["src/conversa-studio.Application/conversa-studio.Application.csproj", "src/conversa-studio.Application/"]
COPY ["src/conversa-studio.Core/conversa-studio.Core.csproj", "src/conversa-studio.Core/"]
COPY ["src/conversa-studio.EntityFrameworkCore/conversa-studio.EntityFrameworkCore.csproj", "src/conversa-studio.EntityFrameworkCore/"]
WORKDIR "/src/src/conversa-studio.Web.Host"
RUN dotnet restore 

WORKDIR /src
COPY ["src/conversa-studio.Web.Host", "src/conversa-studio.Web.Host"]
COPY ["src/conversa-studio.Web.Core", "src/conversa-studio.Web.Core"]
COPY ["src/conversa-studio.Application", "src/conversa-studio.Application"]
COPY ["src/conversa-studio.Core", "src/conversa-studio.Core"]
COPY ["src/conversa-studio.EntityFrameworkCore", "src/conversa-studio.EntityFrameworkCore"]
WORKDIR "/src/src/conversa-studio.Web.Host"
RUN dotnet publish -c Release -o /publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
EXPOSE 80
WORKDIR /app
COPY --from=build /publish .
ENTRYPOINT ["dotnet", "conversa-studio.Web.Host.dll"]
