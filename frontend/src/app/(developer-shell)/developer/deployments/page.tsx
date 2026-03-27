import { DeploymentsWorkspace } from "@/components/developer/DeploymentsWorkspace";

interface DeveloperDeploymentsPageProps {
  searchParams?: Promise<{
    botId?: string;
  }>;
}

export default async function DeveloperDeploymentsPage({
  searchParams,
}: DeveloperDeploymentsPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <DeploymentsWorkspace requestedBotId={resolvedSearchParams?.botId} />
  );
}
