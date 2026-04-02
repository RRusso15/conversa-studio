"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppstoreOutlined, SearchOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Col, Empty, Input, Row, Select, Skeleton, Space, Tag, Typography } from "antd";
import { PageHeader } from "./PageHeader";
import { useStyles } from "./styles";
import { useBotActions } from "@/providers/botProvider";
import { getPublishedTemplate, getPublishedTemplates, toTemplateApiError, type ITemplateSummary } from "@/utils/template-api";

const { Paragraph, Text, Title } = Typography;

export function TemplateLibraryWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { styles } = useStyles();
  const { notification } = App.useApp();
  const { createBotDraft } = useBotActions();
  const [templates, setTemplates] = useState<ITemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [creatingTemplateId, setCreatingTemplateId] = useState<string>();

  useEffect(() => {
    void loadTemplates();
  }, []);

  useEffect(() => {
    if (searchParams.get("pick") === "1") {
      window.requestAnimationFrame(() => {
        document.getElementById("template-library-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [searchParams]);

  const categories = useMemo(() => {
    return Array.from(new Set(templates.map((template) => template.category).filter(Boolean))).sort((left, right) => left.localeCompare(right));
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        template.name.toLowerCase().includes(normalizedSearch) ||
        template.description.toLowerCase().includes(normalizedSearch) ||
        template.category.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory, templates]);

  return (
    <>
      <PageHeader
        title="Template Library"
        description="Browse published starter flows and turn one into a new editable bot draft."
      />

      {errorMessage ? (
        <Alert
          type="error"
          showIcon
          message="Templates could not be loaded"
          description={errorMessage}
          style={{ marginBottom: 20 }}
        />
      ) : null}

      <Card className={styles.placeholderCard} style={{ marginBottom: 20 }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search templates"
              style={{ maxWidth: 320 }}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ minWidth: 220 }}
              options={[
                { value: "all", label: "All categories" },
                ...categories.map((category) => ({ value: category, label: category })),
              ]}
            />
          </Space>

          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Choosing a template creates a new bot draft for you. The template itself stays unchanged.
          </Paragraph>
        </Space>
      </Card>

      <div id="template-library-grid">
        <Row gutter={[20, 20]}>
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Col xs={24} md={12} xl={8} key={`template-skeleton-${index}`}>
                  <Card className={styles.projectCard}>
                    <Skeleton active paragraph={{ rows: 4 }} />
                  </Card>
                </Col>
              ))
            : null}

          {!isLoading && !filteredTemplates.length ? (
            <Col span={24}>
              <Card className={styles.placeholderCard}>
                <Empty description="No published templates match your filters." image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </Card>
            </Col>
          ) : null}

          {filteredTemplates.map((template) => (
            <Col xs={24} md={12} xl={8} key={template.id}>
              <Card className={styles.projectCard}>
                <Space direction="vertical" size="large" style={{ width: "100%", minHeight: 240, justifyContent: "space-between" }}>
                  <Space align="start" style={{ justifyContent: "space-between", width: "100%" }}>
                    <span className={styles.projectIcon}>
                      <AppstoreOutlined />
                    </span>
                    <Tag color="blue">{template.category}</Tag>
                  </Space>

                  <div>
                    <Title level={4} style={{ marginBottom: 8 }}>
                      {template.name}
                    </Title>
                    <Paragraph type="secondary" style={{ marginBottom: 12 }}>
                      {template.description}
                    </Paragraph>
                    <Text type="secondary">Updated {new Date(template.updatedAt).toLocaleString()}</Text>
                  </div>

                  <Button
                    type="primary"
                    loading={creatingTemplateId === template.id}
                    onClick={() => void handleCreateFromTemplate(template.id)}
                  >
                    Use template
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </>
  );

  async function loadTemplates() {
    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const publishedTemplates = await getPublishedTemplates();
      setTemplates(publishedTemplates);
    } catch (error) {
      setErrorMessage(toTemplateApiError(error, "We could not load templates.").message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateFromTemplate(templateId: string) {
    setCreatingTemplateId(templateId);

    try {
      const template = await getPublishedTemplate(templateId);
      const result = await createBotDraft(template.graph);

      if (!result.bot) {
        throw new Error(result.error?.message ?? "The selected template could not be turned into a bot.");
      }

      notification.success({
        message: "Bot created from template",
        description: `${template.name} is now an editable bot draft.`
      });
      router.push(`/developer/builder/${result.bot.id}`);
    } catch (error) {
      notification.error({
        message: "Template could not be used",
        description: error instanceof Error ? error.message : "The selected template could not be turned into a bot."
      });
    } finally {
      setCreatingTemplateId(undefined);
    }
  }
}
