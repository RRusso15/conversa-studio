"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App, Button, Card, Col, Empty, Popconfirm, Row, Skeleton, Space, Tag, Typography } from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/developer/PageHeader";
import { useStyles } from "@/components/developer/styles";
import { createStarterGraph } from "@/components/developer/builder/mock-data";
import {
  createTemplateDraft,
  deleteTemplate,
  duplicateTemplate,
  getAdminTemplates,
  publishTemplateDraft,
  toTemplateApiError,
  unpublishTemplateDraft,
  type ITemplateSummary,
} from "@/utils/template-api";

const { Paragraph, Text, Title } = Typography;

export function AdminTemplatesWorkspace() {
  const router = useRouter();
  const { notification } = App.useApp();
  const { styles } = useStyles();
  const [templates, setTemplates] = useState<ITemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyTemplateId, setBusyTemplateId] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    void loadTemplates();
  }, []);

  return (
    <>
      <PageHeader
        title="Templates"
        description="Author reusable starter flows that developers can apply when creating new bots."
        actions={
          <Space wrap>
            <Button icon={<RocketOutlined />} onClick={() => router.push("/admin/templates/create/prompt")}>
              Generate with AI
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => void handleCreateBlankTemplate()}>
              New blank template
            </Button>
          </Space>
        }
      />

      {errorMessage ? (
        <Card className={styles.placeholderCard} style={{ marginBottom: 20 }}>
          <Text type="danger">{errorMessage}</Text>
        </Card>
      ) : null}

      <Row gutter={[20, 20]}>
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Col xs={24} md={12} xl={8} key={`admin-template-skeleton-${index}`}>
                <Card className={styles.projectCard}>
                  <Skeleton active paragraph={{ rows: 4 }} />
                </Card>
              </Col>
            ))
          : null}

        {!isLoading && !templates.length ? (
          <Col span={24}>
            <Card className={styles.placeholderCard}>
              <Empty description="No templates have been created yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </Card>
          </Col>
        ) : null}

        {templates.map((template) => (
          <Col xs={24} md={12} xl={8} key={template.id}>
            <Card className={styles.projectCard}>
              <Space direction="vertical" size="large" style={{ width: "100%", minHeight: 260, justifyContent: "space-between" }}>
                <Space align="start" style={{ justifyContent: "space-between", width: "100%" }}>
                  <Tag color={template.status === "published" ? "green" : "default"}>
                    {template.status === "published" ? "Published" : "Draft"}
                  </Tag>
                  <Tag color="blue">{template.category}</Tag>
                </Space>

                <div>
                  <Title level={4} style={{ marginBottom: 8 }}>
                    {template.name}
                  </Title>
                  <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                    {template.description}
                  </Paragraph>
                  <Text type="secondary">Updated {new Date(template.updatedAt).toLocaleString()}</Text>
                </div>

                <Space wrap>
                  <Link href={`/admin/templates/${template.id}`}>
                    <Button icon={<EditOutlined />}>Edit</Button>
                  </Link>
                  <Button
                    icon={<CopyOutlined />}
                    loading={busyTemplateId === template.id}
                    onClick={() => void handleDuplicateTemplate(template.id)}
                  >
                    Duplicate
                  </Button>
                  {template.status === "published" ? (
                    <Button loading={busyTemplateId === template.id} onClick={() => void handleUnpublish(template.id)}>
                      Unpublish
                    </Button>
                  ) : (
                    <Button type="primary" loading={busyTemplateId === template.id} onClick={() => void handlePublish(template.id)}>
                      Publish
                    </Button>
                  )}
                  <Popconfirm
                    title="Delete template?"
                    description="This removes both the draft and any published version of the template."
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true, loading: busyTemplateId === template.id }}
                    onConfirm={() => handleDeleteTemplate(template.id)}
                  >
                    <Button danger icon={<DeleteOutlined />} onClick={(event) => event.preventDefault()}>
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );

  async function loadTemplates() {
    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const items = await getAdminTemplates();
      setTemplates(items);
    } catch (error) {
      setErrorMessage(toTemplateApiError(error, "We could not load templates.").message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateBlankTemplate() {
    try {
      const starterTemplate = await createTemplateDraft({
        name: "Untitled Template",
        description: "Reusable starter flow.",
        category: "General",
        graph: createStarterGraph("new-template", "Untitled Template"),
      });

      router.push(`/admin/templates/${starterTemplate.id}`);
    } catch (error) {
      notification.error({
        message: "Template could not be created",
        description: toTemplateApiError(error, "We could not create a blank template.").message
      });
    }
  }

  async function handleDuplicateTemplate(templateId: string) {
    setBusyTemplateId(templateId);

    try {
      const duplicatedTemplate = await duplicateTemplate(templateId);
      notification.success({
        message: "Template duplicated",
        description: "A new editable copy was created."
      });
      router.push(`/admin/templates/${duplicatedTemplate.id}`);
    } catch (error) {
      notification.error({
        message: "Template could not be duplicated",
        description: toTemplateApiError(error, "We could not duplicate that template.").message
      });
    } finally {
      setBusyTemplateId(undefined);
    }
  }

  async function handlePublish(templateId: string) {
    setBusyTemplateId(templateId);

    try {
      await publishTemplateDraft(templateId);
      notification.success({
        message: "Template published",
        description: "Developers can now use this template when creating bots."
      });
      await loadTemplates();
    } catch (error) {
      notification.error({
        message: "Template could not be published",
        description: toTemplateApiError(error, "We could not publish that template.").message
      });
    } finally {
      setBusyTemplateId(undefined);
    }
  }

  async function handleUnpublish(templateId: string) {
    setBusyTemplateId(templateId);

    try {
      await unpublishTemplateDraft(templateId);
      notification.success({
        message: "Template unpublished",
        description: "The template has been removed from the developer library."
      });
      await loadTemplates();
    } catch (error) {
      notification.error({
        message: "Template could not be unpublished",
        description: toTemplateApiError(error, "We could not unpublish that template.").message
      });
    } finally {
      setBusyTemplateId(undefined);
    }
  }

  async function handleDeleteTemplate(templateId: string) {
    setBusyTemplateId(templateId);

    try {
      await deleteTemplate(templateId);
      notification.success({
        message: "Template deleted",
        description: "The template was removed."
      });
      await loadTemplates();
    } catch (error) {
      notification.error({
        message: "Template could not be deleted",
        description: toTemplateApiError(error, "We could not delete that template.").message
      });
    } finally {
      setBusyTemplateId(undefined);
    }
  }
}
