"use client";

import { useEffect, useMemo, useState } from "react";
import { LogoutOutlined, LockOutlined, SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Col, Descriptions, Form, Input, Row, Skeleton, Space, Tag, Typography } from "antd";
import { PageHeader } from "./PageHeader";
import { InfoNotice } from "./InfoNotice";
import { useStyles } from "./styles";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { changePassword } from "@/utils/settings-api";

const { Paragraph, Text, Title } = Typography;

interface IChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export function SettingsWorkspace() {
  const { styles } = useStyles();
  const { notification } = App.useApp();
  const [form] = Form.useForm<IChangePasswordFormValues>();
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const { currentLoginInformations, isPending, isBootstrapped, isAuthenticated } = useAuthState();
  const { fetchCurrentUser, signOut } = useAuthActions();

  useEffect(() => {
    if (isAuthenticated && isBootstrapped && !currentLoginInformations?.user) {
      void fetchCurrentUser();
    }
  }, [currentLoginInformations?.user, fetchCurrentUser, isAuthenticated, isBootstrapped]);

  const accountItems = useMemo(() => {
    const user = currentLoginInformations?.user;

    return [
      {
        key: "full-name",
        label: "Full name",
        children: `${user?.name ?? ""} ${user?.surname ?? ""}`.trim() || "Unavailable",
      },
      {
        key: "username",
        label: "Username",
        children: user?.userName || "Unavailable",
      },
      {
        key: "email",
        label: "Email",
        children: user?.emailAddress || "Unavailable",
      },
    ];
  }, [currentLoginInformations?.user]);

  const workspaceItems = useMemo(() => {
    const tenant = currentLoginInformations?.tenant;
    const application = currentLoginInformations?.application;

    return [
      {
        key: "workspace-name",
        label: "Workspace",
        children: tenant?.name || "Unavailable",
      },
      {
        key: "tenancy-name",
        label: "Tenancy name",
        children: tenant?.tenancyName || "Unavailable",
      },
      {
        key: "tenant-id",
        label: "Tenant ID",
        children: tenant?.id?.toString() || "Unavailable",
      },
      {
        key: "app-version",
        label: "App version",
        children: application?.version || "Unavailable",
      },
      {
        key: "release-date",
        label: "Release date",
        children: application?.releaseDate || "Unavailable",
      },
    ];
  }, [currentLoginInformations?.application, currentLoginInformations?.tenant]);

  const handlePasswordSubmit = async (values: IChangePasswordFormValues): Promise<void> => {
    setIsSavingPassword(true);

    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      form.resetFields();
      notification.success({
        message: "Password updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error) {
      notification.error({
        message: "Password change failed",
        description: error instanceof Error ? error.message : "We could not change your password.",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const isLoading = !isBootstrapped || (isPending && !currentLoginInformations);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Review your account and workspace details, update your password, and manage your current session."
      />

      <InfoNotice
        title="Launch-ready account settings"
        description="This page focuses on real controls available today: account identity, workspace reference details, password updates, and session actions."
        style={{ marginBottom: 20 }}
      />

      {isLoading ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card className={styles.placeholderCard}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
          <Card className={styles.placeholderCard}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        </Space>
      ) : null}

      {!isLoading ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row gutter={[20, 20]}>
            <Col xs={24} xl={12}>
              <Card className={styles.settingsCard}>
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <Space align="center">
                    <span className={styles.settingsIcon}>
                      <UserOutlined />
                    </span>
                    <div>
                      <Title level={4} style={{ margin: 0 }}>
                        Account
                      </Title>
                      <Text type="secondary">Your current login information is shown here as read-only reference.</Text>
                    </div>
                  </Space>

                  <Descriptions
                    column={1}
                    items={accountItems}
                    labelStyle={{ width: "36%", fontWeight: 600 }}
                  />

                  <Tag color="default" style={{ width: "fit-content" }}>
                    Read-only in v1
                  </Tag>
                </Space>
              </Card>
            </Col>

            <Col xs={24} xl={12}>
              <Card className={styles.settingsCard}>
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <Space align="center">
                    <span className={styles.settingsIcon}>
                      <SafetyCertificateOutlined />
                    </span>
                    <div>
                      <Title level={4} style={{ margin: 0 }}>
                        Workspace
                      </Title>
                      <Text type="secondary">Reference details for the tenant and application currently backing this workspace.</Text>
                    </div>
                  </Space>

                  <Descriptions
                    column={1}
                    items={workspaceItems}
                    labelStyle={{ width: "36%", fontWeight: 600 }}
                  />
                </Space>
              </Card>
            </Col>
          </Row>

          <Row gutter={[20, 20]}>
            <Col xs={24} xl={14}>
              <Card className={styles.settingsCard}>
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <Space align="center">
                    <span className={styles.settingsIcon}>
                      <LockOutlined />
                    </span>
                    <div>
                      <Title level={4} style={{ margin: 0 }}>
                        Security
                      </Title>
                      <Text type="secondary">Change the password for the account you are currently using.</Text>
                    </div>
                  </Space>

                  <Form<IChangePasswordFormValues>
                    form={form}
                    layout="vertical"
                    requiredMark={false}
                    onFinish={(values) => void handlePasswordSubmit(values)}
                  >
                    <Form.Item<IChangePasswordFormValues>
                      label="Current password"
                      name="currentPassword"
                      rules={[{ required: true, message: "Enter your current password." }]}
                    >
                      <Input.Password autoComplete="current-password" />
                    </Form.Item>

                    <Form.Item<IChangePasswordFormValues>
                      label="New password"
                      name="newPassword"
                      rules={[
                        { required: true, message: "Enter a new password." },
                        { min: 8, message: "Use at least 8 characters." },
                      ]}
                    >
                      <Input.Password autoComplete="new-password" />
                    </Form.Item>

                    <Form.Item<IChangePasswordFormValues>
                      label="Confirm new password"
                      name="confirmNewPassword"
                      dependencies={["newPassword"]}
                      rules={[
                        { required: true, message: "Confirm your new password." },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue("newPassword") === value) {
                              return Promise.resolve();
                            }

                            return Promise.reject(new Error("The new passwords do not match."));
                          },
                        }),
                      ]}
                    >
                      <Input.Password autoComplete="new-password" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" loading={isSavingPassword}>
                      Update password
                    </Button>
                  </Form>
                </Space>
              </Card>
            </Col>

            <Col xs={24} xl={10}>
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Card className={styles.settingsCard}>
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <Title level={4} style={{ margin: 0 }}>
                      Session
                    </Title>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      Sign out of the current browser session when you are finished or need to switch accounts.
                    </Paragraph>
                    <Button icon={<LogoutOutlined />} onClick={signOut}>
                      Sign out
                    </Button>
                  </Space>
                </Card>

                <Alert
                  type="info"
                  showIcon
                  message="Need workspace help?"
                  description="If your workspace information looks wrong or access stops working, contact your workspace administrator or support team instead of relying on hidden launch-only settings."
                />
              </Space>
            </Col>
          </Row>
        </Space>
      ) : null}
    </>
  );
}
