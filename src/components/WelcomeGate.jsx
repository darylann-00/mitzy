export function WelcomeGate({ onChoose }) {
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 44 }}>
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

        <h2 style={{ fontFamily: "'Righteous', cursive", color: "#E8F5EE", fontSize: 26, margin: "0 0 8px" }}>
          Welcome to Mitzy
        </h2>
        <p style={{ color: "#A8D5B8", fontSize: 15, lineHeight: 1.6, margin: "0 0 28px", fontFamily: "DM Sans, sans-serif" }}>
          Let's get you set up.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={() => onChoose('new')}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none",
              background: "#06A77D", color: "#fff",
              fontSize: 15, fontWeight: 700, fontFamily: "DM Sans, sans-serif",
              cursor: "pointer",
            }}
          >
            I'm new here
          </button>

          <button
            onClick={() => onChoose('returning')}
            style={{
              width: "100%", padding: "14px", borderRadius: 12,
              border: "1.5px solid #2D7A54", background: "transparent",
              color: "#A8D5B8", fontSize: 15, fontWeight: 700,
              fontFamily: "DM Sans, sans-serif", cursor: "pointer",
            }}
          >
            I've used Mitzy before
          </button>
        </div>
      </div>
    </div>
  );
}
