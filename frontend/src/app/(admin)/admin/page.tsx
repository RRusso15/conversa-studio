export default function AdminIndexPage() {
  return (
    <div
      style={{
        border: "1px solid #E5E7EB",
        borderRadius: 24,
        background: "#FFFFFF",
        padding: 24,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>Admin routes are reserved</h2>
      <p style={{ margin: 0, color: "#6B7280", lineHeight: 1.6 }}>
        The MVP implements the developer area first. This page exists so the
        admin role has a stable top-level route and layout from the start.
      </p>
    </div>
  );
}
