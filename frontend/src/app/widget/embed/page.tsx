import { WidgetEmbedClient } from "@/components/public/widget/WidgetEmbedClient";

interface WidgetEmbedPageProps {
  searchParams?: Promise<{
    deploymentKey?: string;
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
      parentOrigin={resolvedSearchParams?.parentOrigin ?? ""}
    />
  );
}
