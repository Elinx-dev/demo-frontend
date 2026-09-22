
interface NoMenuContentProps {
  collapsed?: boolean;
}

export default function NoMenuContent({ collapsed }: NoMenuContentProps) {
  if (collapsed) return null;

  return (
    <div
      style={{
        padding: "24px 16px",
        textAlign: "center",
        fontFamily: "var(--ipc-font-sans)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "16px",
          fontWeight: 600,
          color: "#FFFFFF",
        }}
      >
        Welcome to SLATE
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          color: "#8A9BC2", // Muted text color matching ITEM_DEFAULT_TEXT
          lineHeight: 1.5,
        }}
      >
        No menu items are available for your account yet. Contact an administrator if you believe this is a mistake.
      </p>
    </div>
  );
}
