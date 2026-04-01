using System.Threading.Tasks;
using Abp.Application.Services;
using ConversaStudio.Services.Analytics.Dto;

namespace ConversaStudio.Services.Analytics;

/// <summary>
/// Exposes developer-facing analytics queries for owned bots.
/// </summary>
public interface IAnalyticsAppService : IApplicationService
{
    /// <summary>
    /// Returns aggregate KPI metrics for the current developer.
    /// </summary>
    Task<AnalyticsOverviewDto> GetAnalyticsOverview(GetAnalyticsRequest input);

    /// <summary>
    /// Returns daily conversation trend points for the current developer.
    /// </summary>
    Task<AnalyticsTimeseriesDto> GetAnalyticsTimeseries(GetAnalyticsRequest input);

    /// <summary>
    /// Returns grouped breakdowns for bots, deployments, and conversation statuses.
    /// </summary>
    Task<AnalyticsBreakdownDto> GetAnalyticsBreakdown(GetAnalyticsRequest input);
}
