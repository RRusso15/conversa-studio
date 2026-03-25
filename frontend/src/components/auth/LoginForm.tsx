"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App, Button, Checkbox, Form, Input, Typography } from "antd";
import { useStyles } from "./styles";

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe?: boolean;
}

const { Text } = Typography;

const loginNextRoute = "/developer/dashboard";

export function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { message } = App.useApp();
  const { styles } = useStyles();
  const router = useRouter();

  const handleSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setIsSubmitting(false);

    message.success(`Signed in as Developer: ${values.email}`);
    router.push(loginNextRoute);
  };

  return (
    <>
      <div className={styles.header}>
        <Typography.Title level={2} style={{ marginBottom: 8 }}>
          Welcome back
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Sign in to continue building and managing your chatbot workspace.
        </Typography.Paragraph>
      </div>

      <Form<LoginFormValues>
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
        size="large"
      >
        <Form.Item<LoginFormValues>
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter your email address." },
            { type: "email", message: "Please enter a valid email address." },
          ]}
        >
          <Input placeholder="name@company.com" autoComplete="email" />
        </Form.Item>

        <Form.Item<LoginFormValues>
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please enter your password." }]}
        >
          <Input.Password
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </Form.Item>

        <div className={styles.helperRow}>
          <Form.Item<LoginFormValues>
            name="rememberMe"
            valuePropName="checked"
            noStyle
          >
            <Checkbox>Remember me</Checkbox>
          </Form.Item>

          <Button type="link" style={{ paddingInline: 0 }}>
            Forgot password?
          </Button>
        </div>

        <Button type="primary" htmlType="submit" block loading={isSubmitting}>
          Sign In
        </Button>
      </Form>

      <div className={styles.footer}>
        <Text type="secondary">
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </Text>
      </div>
    </>
  );
}
