"use client";

import { useEffect, useState } from "react";
import { App, Button, Card, Form, Input, Modal, Space, Table, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/developer/PageHeader";
import { getAdminUsers, createAdminUser, type IAdminUser } from "@/utils/admin-user-api";

const { Paragraph } = Typography;

export function AdminAdminsWorkspace() {
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const [admins, setAdmins] = useState<IAdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void loadAdmins();
  }, []);

  return (
    <>
      <PageHeader
        title="Admins"
        description="Add administrators who can manage templates and platform configuration."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            Add admin
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
        title="Add admin"
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => void form.submit()}
        okText="Create admin"
        okButtonProps={{ loading: isSubmitting }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => void handleCreateAdmin(values as {
            userName: string;
            name: string;
            surname: string;
            emailAddress: string;
            password: string;
          })}
        >
          <Form.Item name="name" label="First name" rules={[{ required: true, message: "Enter a first name." }]}>
            <Input />
          </Form.Item>
          <Form.Item name="surname" label="Surname" rules={[{ required: true, message: "Enter a surname." }]}>
            <Input />
          </Form.Item>
          <Form.Item name="userName" label="Username" rules={[{ required: true, message: "Enter a username." }]}>
            <Input />
          </Form.Item>
          <Form.Item name="emailAddress" label="Email" rules={[{ required: true, message: "Enter an email address." }, { type: "email", message: "Enter a valid email address." }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: "Enter a password." }, { min: 8, message: "Use at least 8 characters." }]}>
            <Input.Password />
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

  async function handleCreateAdmin(values: {
    userName: string;
    name: string;
    surname: string;
    emailAddress: string;
    password: string;
  }) {
    setIsSubmitting(true);

    try {
      await createAdminUser(values);
      notification.success({
        message: "Admin created",
        description: "The new administrator can now sign in through the normal login flow."
      });
      setIsModalOpen(false);
      form.resetFields();
      await loadAdmins();
    } catch (error) {
      notification.error({
        message: "Admin could not be created",
        description: error instanceof Error ? error.message : "The administrator could not be created."
      });
    } finally {
      setIsSubmitting(false);
    }
  }
}
