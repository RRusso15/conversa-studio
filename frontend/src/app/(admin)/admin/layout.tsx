import type { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px 20px",
        background: "#F9FAFB",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: 24,
            border: "1px solid #E5E7EB",
            borderRadius: 24,
            background: "#FFFFFF",
            padding: 24,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "6px 10px",
              borderRadius: 999,
              background: "#F3F4F6",
              color: "#111827",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Admin scaffold
          </div>
          <h1 style={{ marginTop: 16, marginBottom: 8 }}>Platform Admin Area</h1>
          <p style={{ margin: 0, color: "#6B7280", lineHeight: 1.6 }}>
            This route group is intentionally reserved for the platform admin
            role so future admin capabilities can be added without revisiting
            the application routing model.
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
