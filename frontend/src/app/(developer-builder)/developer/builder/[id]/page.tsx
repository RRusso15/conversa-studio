import { BuilderWorkspace } from "@/components/developer/BuilderWorkspace";

interface BuilderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DeveloperBuilderPage({
  params,
}: BuilderPageProps) {
  const { id } = await params;

  return <BuilderWorkspace botId={id} />;
}
