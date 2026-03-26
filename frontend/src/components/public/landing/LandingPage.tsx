"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightOutlined,
  BarChartOutlined,
  CheckOutlined,
  DeploymentUnitOutlined,
  LoginOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  SafetyOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Tag, Typography } from "antd";
import { useStyles } from "./styles";

const { Paragraph, Text, Title } = Typography;

const features = [
  {
    icon: <ThunderboltOutlined />,
    title: "Drag-Drop Builder",
    description:
      "Build structured conversations visually with reusable nodes, branches, and a clean editing flow.",
  },
  {
    icon: <RobotOutlined />,
    title: "AI Knowledge Nodes",
    description:
      "Attach documents and website knowledge so open-ended questions stay grounded and useful.",
  },
  {
    icon: <DeploymentUnitOutlined />,
    title: "Multi-Channel Deploy",
    description:
      "Design once, then roll the same bot definition out to web and future messaging channels.",
  },
  {
    icon: <SafetyOutlined />,
    title: "Templates",
    description:
      "Start fast from curated flows for support, lead capture, booking, and internal automation.",
  },
  {
    icon: <ArrowRightOutlined />,
    title: "Prompt-to-Bot",
    description:
      "Generate a usable bot starter from plain language, then refine it visually in the builder.",
  },
  {
    icon: <BarChartOutlined />,
    title: "Analytics",
    description:
      "Track outcomes, fallback points, and engagement so teams can improve conversations quickly.",
  },
  {
    icon: <DeploymentUnitOutlined />,
    title: "Integrations",
    description:
      "Connect workflows to APIs, sheets, CRMs, and future operational systems without losing control.",
  },
  {
    icon: <TeamOutlined />,
    title: "Collaboration",
    description:
      "Give product, support, and operations teams one place to build, review, and ship together.",
  },
];

const pricing = [
  {
    title: "Free",
    price: "$0",
    period: "/mo",
    description: "Perfect for prototyping your first bot.",
    items: ["1 bot", "Web widget", "Core builder", "Basic transcripts"],
    cta: "Get started",
    variant: "default" as const,
  },
  {
    title: "Pro",
    price: "$49",
    period: "/mo",
    description: "For teams shipping bots in production.",
    items: [
      "Unlimited bot drafts",
      "AI nodes",
      "Deployments",
      "Analytics",
      "Priority support",
    ],
    cta: "Start free trial",
    featured: true,
    variant: "primary" as const,
  },
  {
    title: "Business",
    price: "$199",
    period: "/mo",
    description: "For scaling usage, collaboration, and integrations.",
    items: [
      "Everything in Pro",
      "More usage limits",
      "Advanced analytics",
      "Collaboration",
      "Custom integrations",
    ],
    cta: "Contact sales",
    variant: "default" as const,
  },
];

export function LandingPage() {
  const { styles } = useStyles();

  return (
    <div className={styles.page}>
      <header className={styles.navShell}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brandLink}>
            <span className={styles.brandMark}>
              <Image
                src="/images/logo.png"
                alt="Conversa Studio logo"
                width={28}
                height={28}
              />
            </span>
            <span>Conversa Studio</span>
          </Link>

          <Space size="middle">
            <Link href="/login">
              <Button type="text" icon={<LoginOutlined />}>
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button type="primary" size="large">
                Get Started
              </Button>
            </Link>
          </Space>
        </div>
      </header>

      <main>
        <section className={styles.heroSection}>
          <span className={styles.heroBadge}>
            <ThunderboltOutlined />
            Introducing Conversa Studio 1.0
          </span>

          <Title className={styles.heroTitle}>
            Build AI chatbots
            <br />
            <span className={styles.gradientText}>visually and fast</span>
          </Title>

          <Paragraph className={styles.heroCopy}>
            Conversa Studio gives startups and businesses a polished way to
            design, validate, deploy, and manage chatbots across channels
            without losing control of conversation logic.
          </Paragraph>

          <div className={styles.heroActions}>
            <Link href="/signup">
              <Button type="primary" size="large" icon={<ArrowRightOutlined />}>
                Start Free Trial
              </Button>
            </Link>
            <Button size="large" icon={<PlayCircleOutlined />}>
              Watch Demo
            </Button>
          </div>

          <div className={styles.previewCard}>
            <div className={styles.previewTop}>
              <div className={styles.panel}>
                <Title level={5}>Node palette</Title>
                <Text type="secondary">
                  Structured blocks for deterministic and AI-assisted flows.
                </Text>
                {["Start", "Message", "Question", "Condition", "AI Node"].map(
                  (item) => (
                    <div key={item} className={styles.paletteItem}>
                      <span>{item}</span>
                      <Tag color="default">Drag</Tag>
                    </div>
                  ),
                )}
              </div>

              <div className={styles.panel}>
                <Title level={5}>Builder preview</Title>
                <div className={styles.canvas}>
                  <div className={styles.canvasNodePrimary}>
                    <Text style={{ color: "rgba(255,255,255,0.72)" }}>
                      Trigger
                    </Text>
                    <Title level={5} style={{ color: "white", marginTop: 6 }}>
                      Start Conversation
                    </Title>
                  </div>
                  <div className={styles.canvasConnectorOne} />
                  <div className={styles.canvasNodeSecondary}>
                    <Text type="secondary">AI Node</Text>
                    <Title level={5} style={{ marginTop: 6 }}>
                      Answer from knowledge base
                    </Title>
                  </div>
                  <div className={styles.canvasConnectorTwo} />
                  <div className={styles.canvasNodeTertiary}>
                    <Text strong>Collect lead details</Text>
                  </div>
                </div>
              </div>

              <div className={styles.panel}>
                <Title level={5}>Runtime confidence</Title>
                <Paragraph type="secondary">
                  Graph validation, transcripts, variables, and deployment
                  settings live on the platform backend from day one.
                </Paragraph>
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <Tag color="default">Exactly one start node</Tag>
                  <Tag color="default">Valid branches and references</Tag>
                  <Tag color="green">Channel-ready output contracts</Tag>
                </Space>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Title level={2}>Everything you need to build better bots</Title>
            <Paragraph type="secondary">
              Strong builder UX, reliable execution, and workspace tools built
              for teams shipping conversational experiences.
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            {features.map((feature) => (
              <Col xs={24} md={12} xl={6} key={feature.title}>
                <Card className={styles.featureCard}>
                  <span className={styles.featureIcon}>{feature.icon}</span>
                  <Title level={4}>{feature.title}</Title>
                  <Paragraph type="secondary">{feature.description}</Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Title level={2}>Simple, transparent pricing</Title>
            <Paragraph type="secondary">
              Start free, validate your use case, and scale when deployments and
              analytics become core to the business.
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            {pricing.map((tier) => (
              <Col xs={24} lg={8} key={tier.title}>
                <Card
                  className={`${styles.pricingCard} ${
                    tier.featured ? styles.pricingFeatured : ""
                  }`}
                >
                  {tier.featured ? (
                    <Tag color="green" className={styles.pricingRibbon}>
                      Most Popular
                    </Tag>
                  ) : null}

                  <Title level={3}>{tier.title}</Title>
                  <div className={styles.price}>
                    <Title level={1} style={{ margin: 0 }}>
                      {tier.price}
                    </Title>
                    <Text type="secondary">{tier.period}</Text>
                  </div>
                  <Paragraph type="secondary">{tier.description}</Paragraph>

                  <Space
                    direction="vertical"
                    size="middle"
                    style={{ width: "100%", marginBottom: 28 }}
                  >
                    {tier.items.map((item) => (
                      <Space key={item} align="start">
                        <CheckOutlined
                          style={{ color: "#16a34a", marginTop: 4 }}
                        />
                        <Text>{item}</Text>
                      </Space>
                    ))}
                  </Space>

                  <Link href="/signup">
                    <Button block type={tier.variant} size="large">
                      {tier.cta}
                    </Button>
                  </Link>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <section className={styles.footerCta}>
          <div className={styles.footerCard}>
            <Row gutter={[24, 24]} align="middle" justify="space-between">
              <Col xs={24} lg={16}>
                <Title level={2} style={{ color: "white", marginTop: 0 }}>
                  Start designing your first chatbot flow today
                </Title>
                <Paragraph
                  style={{ color: "rgba(255,255,255,0.78)", fontSize: 16 }}
                >
                  Bring product, support, and operations together in one bot
                  platform that feels intentional from the first screen.
                </Paragraph>
              </Col>
              <Col xs={24} lg={8}>
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <Link href="/signup">
                    <Button type="primary" size="large" block>
                      Create account
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="large" block>
                      Sign in
                    </Button>
                  </Link>
                </Space>
              </Col>
            </Row>
          </div>
        </section>
      </main>
    </div>
  );
}
