import { AnalyticsWorkspace } from "@/components/developer/AnalyticsWorkspace";
import { AnalyticsProvider } from "@/providers/analyticsProvider";

export default function DeveloperAnalyticsPage() {
  return (
    <AnalyticsProvider>
      <AnalyticsWorkspace />
    </AnalyticsProvider>
  );
}
