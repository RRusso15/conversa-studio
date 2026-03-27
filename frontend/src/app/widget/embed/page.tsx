import { WidgetEmbedClient } from "@/components/public/widget/WidgetEmbedClient";

interface WidgetEmbedPageProps {
  searchParams?: Promise<{
    deploymentKey?: string;
    apiBaseUrl?: string;
    parentOrigin?: string;
  }>;
}

export default async function WidgetEmbedPage({
  searchParams,
}: WidgetEmbedPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <WidgetEmbedClient
      deploymentKey={resolvedSearchParams?.deploymentKey ?? ""}
      apiBaseUrl={resolvedSearchParams?.apiBaseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? ""}
      parentOrigin={resolvedSearchParams?.parentOrigin ?? ""}
    />
  );
}
