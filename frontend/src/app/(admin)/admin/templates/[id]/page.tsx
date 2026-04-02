import { AdminTemplateBuilderWorkspace } from "@/components/admin/AdminTemplateBuilderWorkspace";

interface AdminTemplateBuilderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminTemplateBuilderPage({ params }: AdminTemplateBuilderPageProps) {
  const { id } = await params;
  return <AdminTemplateBuilderWorkspace templateId={id} />;
}
