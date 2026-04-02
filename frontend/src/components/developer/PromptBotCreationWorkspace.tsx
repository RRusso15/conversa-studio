"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, App, Button, Card, Form, Input, Space, Typography } from "antd";
import { PageHeader } from "./PageHeader";
import { useStyles } from "./styles";
import { useBotActions } from "@/providers/botProvider";
import { generateBotGraphFromPrompt } from "@/utils/bot-generation-api";

const { Paragraph, Text } = Typography;

export function PromptBotCreationWorkspace() {
  const router = useRouter();
  const { styles } = useStyles();
  const { notification } = App.useApp();
  const { createBotDraft, upsertBotAiSettings } = useBotActions();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationNotes, setGenerationNotes] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>();

  return (
    <>
      <PageHeader
        title="Create Bot From Prompt"
        description="Describe the conversation flow you want and generate a starter bot graph you can keep editing in the builder."
      />

      <Card className={styles.placeholderCard}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Prompt generation uses your Gemini API key and creates a builder-ready draft. The key is also saved on the new bot so you can keep using Gemini-based features later.
          </Paragraph>

          {errorMessage ? (
            <Alert
              type="error"
              showIcon
              message="Bot could not be generated"
              description={errorMessage}
            />
          ) : null}

          {generationNotes.length > 0 ? (
            <Alert
              type="info"
              showIcon
              message="Generation notes"
              description={generationNotes.join(" ")}
            />
          ) : null}

          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => void handleSubmit(values as { botName: string; prompt: string; apiKey: string })}
          >
            <Form.Item
              name="botName"
              label="Bot name"
              rules={[{ required: true, message: "Give the bot a name." }]}
            >
              <Input placeholder="Support triage bot" />
            </Form.Item>

            <Form.Item
              name="prompt"
              label="Prompt"
              rules={[{ required: true, message: "Describe the bot you want to create." }]}
            >
              <Input.TextArea
                rows={10}
                placeholder="Build a support intake bot that greets the user, asks for their name and email, understands whether they need billing, technical, or account help, and hands off account issues to support."
              />
            </Form.Item>

            <Form.Item
              name="apiKey"
              label="Gemini API key"
              rules={[{ required: true, message: "A Gemini API key is required for prompt generation." }]}
            >
              <Input.Password placeholder="AIza..." />
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                Generate bot
              </Button>
              <Button onClick={() => router.push("/developer/projects")}>Cancel</Button>
            </Space>
          </Form>

          <Text type="secondary">
            Prompt generation currently uses a safe builder subset: start, message, question, condition, variable, handoff, and end nodes.
          </Text>
        </Space>
      </Card>
    </>
  );

  async function handleSubmit(values: { botName: string; prompt: string; apiKey: string }) {
    setIsSubmitting(true);
    setErrorMessage(undefined);
    setGenerationNotes([]);

    try {
      const generated = await generateBotGraphFromPrompt(values);
      const creationResult = await createBotDraft(generated.graph);

      if (!creationResult.bot) {
        throw new Error(creationResult.error?.message ?? "The generated bot could not be created.");
      }

      await upsertBotAiSettings({
        botId: creationResult.bot.id,
        apiKey: values.apiKey,
        generationModel: "gemini-2.5-flash",
        embeddingModel: "gemini-embedding-001"
      });

      setGenerationNotes(generated.notes);
      notification.success({
        message: "Bot generated",
        description: "Your prompt was turned into a new editable bot draft."
      });
      router.push(`/developer/builder/${creationResult.bot.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The bot could not be generated from that prompt.");
    } finally {
      setIsSubmitting(false);
    }
  }
}
