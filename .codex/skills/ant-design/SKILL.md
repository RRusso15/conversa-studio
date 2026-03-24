---
name: frontend-next-antd-design
description: Design and implement frontend UI using Next.js App Router with Ant Design and antd-style, emphasizing server components, strong typing, and modular structure.
---

## When to use this skill

Use this skill whenever you are:
- Designing or implementing **new frontend pages or components**.
- Refactoring **existing UI** to align with the project’s conventions.
- Reviewing frontend code for **consistency, type safety, and structure**.

The goal is to produce a clean, modular, responsive,strongly-typed UI that matches the project’s visual language (white and blue theme) and uses **Next.js App Router + Ant Design + antd-style**.

Before write code, come up with a plan, and let me approve it first. You should include how you are going to implement it, files you are going to add or modify and why the plan works

---

## Tech Stack & Global Constraints

1. **Framework**
   - Use **Next.js `16.1.6`**.
   - Use the **App Router** (`app/` directory) for routing.

2. **Component Model**
   - **Prefer Server Components** by default.
   - Only use **Client Components** when required (e.g., hooks like `useState`, `useEffect`, `useRouter`, `localStorage`, event handlers that depend on browser APIs, etc.).
   - Mark client components explicitly with `"use client"` at the top of the file.

3. **UI Library**
   - Use **Ant Design** components for UI building blocks.
   - Reference: https://ant.design/components/overview/

   Example pattern:
   ```tsx
   import { Button } from "antd";
   import { UserOutlined } from "@ant-design/icons";
   import { useRouter } from "next/navigation";

   "use client";

   const ProfileButton: React.FC = () => {
     const router = useRouter();

     return (
       <Button
         type="default"
         shape="circle"
         icon={<UserOutlined />}
         onClick={() => router.push("/profile")}
         aria-label="Go to profile"
       />
     );
   };

   export default ProfileButton;

   Styling

Use antd-style for styling.

Define styles in a dedicated styles.ts (or style.ts) file per component/page.

Import via: import { useStyles } from "./style/styles";

Example styles.ts:

import { createStyles, css } from "antd-style";

export const useStyles = createStyles(({ token }) => ({
  pageWrapper: css`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${token.colorBgLayout};
  `,

  card: css`
    width: 420px;
    border-radius: 16px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.1);
    padding: 12px 8px;
    background: ${token.colorBgContainer};
  `,

  header: css`
    text-align: center;
    margin-bottom: 32px;
  `,

  title: css`
    margin-bottom: 4px;
  `,
}));

Example usage in a component:

import { Typography } from "antd";
import { useStyles } from "./style/styles";

const { Title, Text } = Typography;

const LoginHeader: React.FC = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.header}>
      <Title level={3} className={styles.title}>
        Welcome back
      </Title>
      <Text type="secondary" style={{ fontSize: 14 }}>
        Sign in to your account to continue
      </Text>
    </div>
  );
};

export default LoginHeader;

Color Palette

Primary theme: white and blue.

Use Ant Design tokens / theme overrides rather than hard-coded colors where possible.

When hard-coding is necessary, prefer subtle blues for primary actions and keep backgrounds predominantly white/light.

Architecture & Code Organization

Routing

Use Next.js App Router:

Pages live under app/.

Use nested routes and layouts (app/(segment)/layout.tsx, app/(segment)/page.tsx).

Use Link and useRouter from next/navigation for navigation.

Component Decomposition

Break pages into small, focused components:

Example for a page:

app/(auth)/login/page.tsx – page entry (server component).

app/(auth)/login/LoginForm.tsx – client component with form logic.

app/(auth)/login/LoginHeader.tsx – UI-only header.

app/(auth)/login/style/styles.ts – styles.

Keep components single-responsibility:

Layout-only vs. data-fetching vs. form-logic components.

TypeScript & Types

Everything must be typed:

Use interface or type aliases for props and data models.

Avoid any unless absolutely unavoidable; prefer proper domain types.

Example:

export interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
  isLoading: boolean;
}
const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading }) => {
  // ...
};

Data Fetching & Suspense

For server components, use async functions to fetch data directly from the server.

Wrap data-dependent UI in <Suspense> when appropriate:

For slower data calls.

For sections that can load independently.

Example:

import { Suspense } from "react";
import UsersTable from "./UsersTable";

const UsersPage = async () => {
  return (
    <Suspense fallback={<div>Loading users...</div>}>
      <UsersTable />
    </Suspense>
  );
};

export default UsersPage;

When using Suspense in client components, ensure data fetching supports it (e.g., React cache, appropriate hooks, or server components providing data).

Implementation Checklist

When generating or refactoring code with this skill, always ensure:

Next.js App Router

The file is placed correctly under app/ with appropriate page.tsx, layout.tsx, or segment structure.

Server vs Client

Default to server components.

Add "use client" only where needed (hooks, browser APIs, event-heavy UI).

Ant Design Usage

Use Ant Design components for layout, forms, modals, tables, etc.

Avoid reinventing standard UI elements that already exist in Ant Design.

antd-style

Styles defined in styles.ts (or similar) using createStyles.

Components import and use useStyles() and styles.* classNames.

Types & Interfaces

All props and domain objects have clear TypeScript types/interfaces.

No untyped/loosely-typed props.

Suspense

Use <Suspense> for sections depending on asynchronous data where it improves UX.

Provide simple, non-flashy fallbacks that respect the white/blue theme.

Visual Consistency

Main colors: white + blue.

Keep the look clean, modern, and consistent:

Adequate spacing

Rounded corners for cards where appropriate

Minimal inline styles (prefer antd-style and Ant Design theming)


Leverage Server-Side Rendering Wisely
While server-side rendering enhances SEO and initial page load times, it may not be necessary for all pages. Identify pages that require SSR, such as dynamic or content-heavy pages, and use Next.js’s “getServerSideProps” or “getInitialProps” functions selectively for optimal performance.

Embrace Static Site Generation (SSG)
Static Site Generation offers better performance and scalability compared to SSR for pages with static content. For pages that do not require real-time data, leverage SSG with “getStaticProps” to generate static HTML files at build time and serve them directly to users, reducing server load.

Optimize Image Loading
Images can significantly impact page load times. Use Next.js’s “Image” component, which automatically optimizes images and provides lazy loading, ensuring faster rendering and improved performance.

Code Splitting and Dynamic Imports
Take advantage of Next.js’s built-in code splitting feature to divide your application code into smaller, more manageable chunks. Use dynamic imports to load non-essential components only when needed, reducing the initial bundle size and improving overall page load times.

Minimize Third-Party Dependencies
Be cautious when adding third-party libraries and packages to your project, as they can increase the bundle size and affect performance. Opt for lightweight alternatives or, where feasible, write custom solutions to reduce dependencies.

Manage State Effectively
Select the appropriate state management solution for your project, such as React’s built-in “useState” and “useReducer” hooks or external libraries like Redux or Zustand. Keep the global state minimal, and prefer passing data between components using props whenever possible.

Opt for TypeScript Integration
Integrating TypeScript in your Next.js project provides static type-checking, reducing the chances of runtime errors and enhancing code reliability. Embrace TypeScript to improve code maintainability and collaboration within your team.

Properly Handle Error States
Handle error states gracefully by implementing custom error pages using Next.js’s “ErrorBoundary” or the “getStaticProps” and “getServerSideProps” functions. Providing users with informative error messages enhances user experience and helps identify and resolve issues quickly.

Implement Caching Strategies
Leverage caching techniques, such as HTTP caching and data caching, to reduce server requests and enhance performance. Caching can significantly improve response times for frequently requested resources.