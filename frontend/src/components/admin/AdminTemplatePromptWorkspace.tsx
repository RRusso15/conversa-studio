"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, App, Button, Card, Form, Input, Space, Typography } from "antd";
import { PageHeader } from "@/components/developer/PageHeader";
import { useStyles } from "@/components/developer/styles";
import { generateBotGraphFromPrompt } from "@/utils/bot-generation-api";
import { createTemplateDraft, toTemplateApiError } from "@/utils/template-api";

const { Paragraph } = Typography;

export function AdminTemplatePromptWorkspace() {
  const router = useRouter();
  const { notification } = App.useApp();
  const { styles } = useStyles();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationNotes, setGenerationNotes] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>();

  return (
    <>
      <PageHeader
        title="Generate Template With AI"
        description="Describe the reusable flow you want, generate a starter graph, and continue editing it in the template builder."
      />

      <Card className={styles.placeholderCard}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            The generated graph opens as a normal editable template draft. You can refine it in the builder before publishing it to developers.
          </Paragraph>

          {errorMessage ? (
            <Alert type="error" showIcon message="Template could not be generated" description={errorMessage} />
          ) : null}

          {generationNotes.length > 0 ? (
            <Alert type="info" showIcon message="Generation notes" description={generationNotes.join(" ")} />
          ) : null}

          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => void handleSubmit(values as {
              name: string;
              description: string;
              category: string;
              prompt: string;
              apiKey: string;
            })}
          >
            <Form.Item name="name" label="Template name" rules={[{ required: true, message: "Give the template a name." }]}>
              <Input placeholder="Support triage starter" />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ required: true, message: "Add a short description." }]}>
              <Input.TextArea rows={3} placeholder="Handles support intake, captures email, and routes common issue types." />
            </Form.Item>
            <Form.Item name="category" label="Category" initialValue="Support" rules={[{ required: true, message: "Choose a category." }]}>
              <Input placeholder="Support" />
            </Form.Item>
            <Form.Item name="prompt" label="Prompt" rules={[{ required: true, message: "Describe the template you want." }]}>
              <Input.TextArea
                rows={10}
                placeholder="Create a reusable customer support intake flow that greets the user, captures their name and email, asks whether they need billing, technical, or account help, and hands off account issues to a human."
              />
            </Form.Item>
            <Form.Item name="apiKey" label="Gemini API key" rules={[{ required: true, message: "A Gemini API key is required." }]}>
              <Input.Password placeholder="AIza..." />
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                Generate template
              </Button>
              <Button onClick={() => router.push("/admin/templates")}>Cancel</Button>
            </Space>
          </Form>
        </Space>
      </Card>
    </>
  );

  async function handleSubmit(values: {
    name: string;
    description: string;
    category: string;
    prompt: string;
    apiKey: string;
  }) {
    setIsSubmitting(true);
    setErrorMessage(undefined);
    setGenerationNotes([]);

    try {
      const generated = await generateBotGraphFromPrompt({
        botName: values.name,
        prompt: values.prompt,
        apiKey: values.apiKey,
      });
      const template = await createTemplateDraft({
        name: values.name,
        description: values.description,
        category: values.category,
        graph: generated.graph,
      });

      setGenerationNotes(generated.notes);
      notification.success({
        message: "Template generated",
        description: "Your AI-generated template draft is ready in the builder."
      });
      router.push(`/admin/templates/${template.id}`);
    } catch (error) {
      setErrorMessage(toTemplateApiError(error, "The template could not be generated.").message);
    } finally {
      setIsSubmitting(false);
    }
  }
}
