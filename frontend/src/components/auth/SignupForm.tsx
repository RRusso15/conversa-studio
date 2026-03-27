"use client";

import { useState } from "react";
import Link from "next/link";
import { App, Button, Form, Input, Typography } from "antd";
import { useAuthActions } from "@/providers/authProvider";
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
  const { signUp } = useAuthActions();

  const handleSubmit = async (values: SignupFormValues) => {
    setIsSubmitting(true);

    try {
      const { name, surname } = splitFullName(values.fullName);

      await signUp({
        name,
        surname,
        userName: values.email,
        emailAddress: values.email,
        password: values.password,
      });

      message.success(
        `Welcome, ${values.fullName}. Your Conversa Studio account has been created.`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to create account.";
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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

function splitFullName(fullName: string) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return { name: "", surname: "" };
  }

  if (parts.length === 1) {
    return { name: parts[0], surname: parts[0] };
  }

  return {
    name: parts.slice(0, -1).join(" "),
    surname: parts[parts.length - 1],
  };
}
