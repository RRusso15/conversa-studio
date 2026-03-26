"use client";

import { useState } from "react";
import Link from "next/link";
import { App, Button, Form, Input, Typography } from "antd";
import { useStyles } from "./styles";

export interface SignupFormValues {
  fullName: string;
  email: string;
  password: string;
}

const { Text } = Typography;

export function SignupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { message } = App.useApp();
  const { styles } = useStyles();

  const handleSubmit = async (values: SignupFormValues) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setIsSubmitting(false);

    message.success(
      `Welcome, ${values.fullName}. Your Conversa Studio account has been created.`,
    );
  };

  return (
    <>
      <div className={styles.header}>
        <Typography.Title level={2} style={{ marginBottom: 8 }}>
          Create an account
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Create your workspace and start building AI chat experiences for
          support, sales, and operations.
        </Typography.Paragraph>
      </div>

      <Form<SignupFormValues>
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
        size="large"
      >
        <Form.Item<SignupFormValues>
          label="Full name"
          name="fullName"
          rules={[{ required: true, message: "Please enter your full name." }]}
        >
          <Input placeholder="Jane Doe" autoComplete="name" />
        </Form.Item>

        <Form.Item<SignupFormValues>
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter your email address." },
            { type: "email", message: "Please enter a valid email address." },
          ]}
        >
          <Input placeholder="name@company.com" autoComplete="email" />
        </Form.Item>

        <Form.Item<SignupFormValues>
          label="Password"
          name="password"
          rules={[
            { required: true, message: "Please create a password." },
            { min: 8, message: "Use at least 8 characters." },
          ]}
        >
          <Input.Password
            placeholder="Create a strong password"
            autoComplete="new-password"
          />
        </Form.Item>

        <Button type="primary" htmlType="submit" block loading={isSubmitting}>
          Create Account
        </Button>
      </Form>

      <div className={styles.footer}>
        <Text type="secondary">
          Already have an account? <Link href="/login">Log in</Link>
        </Text>
      </div>
    </>
  );
}
