"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppstoreOutlined, PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Row, Skeleton, Statistic, Typography } from "antd";
import { PageHeader } from "@/components/developer/PageHeader";
import { useStyles } from "@/components/developer/styles";
import { getAdminUsers } from "@/utils/admin-user-api";
import { getAdminTemplates, toTemplateApiError } from "@/utils/template-api";

const { Paragraph } = Typography;

export function AdminDashboardWorkspace() {
  const { styles } = useStyles();
  const [isLoading, setIsLoading] = useState(true);
  const [templateCount, setTemplateCount] = useState(0);
  const [publishedTemplateCount, setPublishedTemplateCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Manage platform templates and administrator access from one place."
        actions={
          <Link href="/admin/templates">
            <Button type="primary" icon={<PlusOutlined />}>
              Manage templates
            </Button>
          </Link>
        }
      />

      {errorMessage ? (
        <Alert type="error" showIcon message="Admin metrics could not be loaded" description={errorMessage} style={{ marginBottom: 20 }} />
      ) : null}

      <Row gutter={[20, 20]}>
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Col xs={24} md={12} xl={8} key={`admin-dashboard-skeleton-${index}`}>
                <Card className={styles.statsCard}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              </Col>
            ))
          : (
            <>
              <Col xs={24} md={12} xl={8}>
                <Card className={styles.statsCard}>
                  <Statistic title="Templates" value={templateCount} prefix={<AppstoreOutlined />} />
                </Card>
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Card className={styles.statsCard}>
                  <Statistic title="Published templates" value={publishedTemplateCount} prefix={<AppstoreOutlined />} />
                </Card>
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Card className={styles.statsCard}>
                  <Statistic title="Admins" value={adminCount} prefix={<TeamOutlined />} />
                </Card>
              </Col>
            </>
          )}
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 8 }}>
        <Col xs={24} xl={12}>
          <Card className={styles.placeholderCard}>
            <Paragraph style={{ marginBottom: 0 }}>
              Template publishing controls what developers see when they choose to start from a template. Keep reusable starter flows published and use draft changes when refining them.
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className={styles.placeholderCard}>
            <Paragraph style={{ marginBottom: 0 }}>
              Administrator access controls who can author templates, generate new template drafts with AI, and manage other admins.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </>
  );

  async function loadDashboard() {
    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const [templates, admins] = await Promise.all([
        getAdminTemplates(),
        getAdminUsers()
      ]);

      setTemplateCount(templates.length);
      setPublishedTemplateCount(templates.filter((template) => template.status === "published").length);
      setAdminCount(admins.length);
    } catch (error) {
      setErrorMessage(toTemplateApiError(error, "We could not load the admin dashboard.").message);
    } finally {
      setIsLoading(false);
    }
  }
}
