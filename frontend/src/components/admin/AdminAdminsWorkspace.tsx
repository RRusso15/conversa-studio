"use client";

import { useEffect, useMemo, useState } from "react";
import { App, Button, Card, Form, Modal, Select, Space, Table, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/developer/PageHeader";
import {
  getAdminUsers,
  getPromotableUsers,
  promoteUserToAdmin,
  type IAdminUser,
  type IPromotableUser,
} from "@/utils/admin-user-api";

const { Paragraph } = Typography;

export function AdminAdminsWorkspace() {
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const [admins, setAdmins] = useState<IAdminUser[]>([]);
  const [promotableUsers, setPromotableUsers] = useState<IPromotableUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPromotableLoading, setIsPromotableLoading] = useState(false);

  useEffect(() => {
    void loadAdmins();
  }, []);

  const promotableOptions = useMemo(
    () =>
      promotableUsers.map((user) => ({
        value: user.id,
        label: `${`${user.name} ${user.surname}`.trim() || user.userName} (${user.emailAddress})`,
      })),
    [promotableUsers]
  );

  return (
    <>
      <PageHeader
        title="Admins"
        description="Promote registered users who can manage templates and platform configuration."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => void handleOpenPromoteModal()}>
            Promote to admin
          </Button>
        }
      />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Admins sign in through the same authentication flow as developers, but they are routed into the admin area after login.
          </Paragraph>

          <Table<IAdminUser>
            rowKey="id"
            loading={isLoading}
            dataSource={admins}
            pagination={false}
            columns={[
              {
                title: "Name",
                render: (_, record) => `${record.name} ${record.surname}`.trim() || record.userName,
              },
              {
                title: "Username",
                dataIndex: "userName",
              },
              {
                title: "Email",
                dataIndex: "emailAddress",
              },
              {
                title: "Status",
                render: (_, record) => <Tag color={record.isActive ? "green" : "default"}>{record.isActive ? "Active" : "Inactive"}</Tag>,
              },
              {
                title: "Created",
                render: (_, record) => new Date(record.creationTime).toLocaleString(),
              },
            ]}
          />
        </Space>
      </Card>

      <Modal
        open={isModalOpen}
        title="Promote to admin"
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => void form.submit()}
        okText="Promote user"
        okButtonProps={{ loading: isSubmitting }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => void handlePromoteAdmin(values as { userId: number })}
        >
          <Paragraph type="secondary">
            Choose an existing registered user. Their login details stay the same and they will gain access to the admin area.
          </Paragraph>
          <Form.Item name="userId" label="User" rules={[{ required: true, message: "Choose a user to promote." }]}>
            <Select
              showSearch
              placeholder={isPromotableLoading ? "Loading users..." : "Search by name, username, or email"}
              options={promotableOptions}
              loading={isPromotableLoading}
              filterOption={(input, option) => option?.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false}
              notFoundContent={isPromotableLoading ? "Loading users..." : "No eligible users found"}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );

  async function loadAdmins() {
    setIsLoading(true);

    try {
      const items = await getAdminUsers();
      setAdmins(items);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadPromotableUsers() {
    setIsPromotableLoading(true);

    try {
      const items = await getPromotableUsers();
      setPromotableUsers(items);
    } finally {
      setIsPromotableLoading(false);
    }
  }

  async function handleOpenPromoteModal() {
    setIsModalOpen(true);
    await loadPromotableUsers();
  }

  async function handlePromoteAdmin(values: { userId: number }) {
    setIsSubmitting(true);

    try {
      const selectedUser = promotableUsers.find((user) => user.id === values.userId);

      if (!selectedUser) {
        throw new Error("That user could not be found. Refresh the list and try again.");
      }

      await promoteUserToAdmin(selectedUser);
      notification.success({
        message: "User promoted",
        description: "The selected user can now sign in through the normal login flow and access the admin area."
      });
      setIsModalOpen(false);
      form.resetFields();
      await Promise.all([loadAdmins(), loadPromotableUsers()]);
    } catch (error) {
      notification.error({
        message: "User could not be promoted",
        description: error instanceof Error ? error.message : "The selected user could not be promoted to admin."
      });
    } finally {
      setIsSubmitting(false);
    }
  }
}
