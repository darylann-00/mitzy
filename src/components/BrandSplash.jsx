export function BrandSplash() {
  return (
    <div style={{
      minHeight: "100vh", background: "#1A5C3A",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "28px 24px", position: "relative", overflow: "hidden",
    }}>
      {/* Memphis shapes */}
      <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", background: "#0F3D27", top: -40, right: -40 }} />
      <div style={{ position: "absolute", width: 60,  height: 60,  borderRadius: "50%", background: "#06A77D", top: 20, right: 60, opacity: 0.7 }} />
      <div style={{ position: "absolute", width: 20,  height: 20,  background: "#F77F00", transform: "rotate(45deg)", bottom: 60, right: 30 }} />
      <div style={{ position: "absolute", width: 80,  height: 80,  borderRadius: "50%", background: "#0F3D27", bottom: -30, left: -20 }} />
      <div style={{ position: "absolute", width: 14,  height: 14,  background: "#F4C430", transform: "rotate(45deg)", top: 80, left: 30, opacity: 0.7 }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative" }}>
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#D62828" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F77F00" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#06A77D" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F4C430" }} />
          </div>
          <span style={{ fontFamily: "'Righteous', 'Trebuchet MS', cursive", fontSize: 38, color: "#E8F5EE", lineHeight: 1 }}>
            mitzy
          </span>
        </div>
      </div>
    </div>
  );
}
