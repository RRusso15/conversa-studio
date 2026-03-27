"use client";

import { useState } from "react";
import Link from "next/link";
import { App, Button, Checkbox, Form, Input, Typography } from "antd";
import { useAuthActions } from "@/providers/authProvider";
import { useStyles } from "./styles";

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe?: boolean;
}

const { Text } = Typography;

export function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { message } = App.useApp();
  const { styles } = useStyles();
  const { signIn } = useAuthActions();

  const handleSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);

    try {
      await signIn({
        userNameOrEmailAddress: values.email,
        password: values.password,
        rememberClient: values.rememberMe ?? false,
      });
      message.success("Signed in successfully.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to sign in.";
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.header}>
        <Typography.Title level={2} style={{ marginBottom: 8 }}>
          Welcome back
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Sign in to manage your bots, review conversations, and keep your team
          moving.
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
