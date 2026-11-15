import { ImageResponse } from "next/og";

export const alt = "Meka Studio — Videography & Photography";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(circle at 15% 100%, rgba(45,255,138,0.28), #000 55%)",
          color: "#f4f5f7",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, letterSpacing: 8, textTransform: "uppercase", color: "#c9ccd1" }}>
          <div style={{ width: 16, height: 16, borderRadius: 16, background: "#ff3b3b" }} /> REC · Meka Studio
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 120, fontWeight: 900, lineHeight: 0.95, letterSpacing: -4, textTransform: "uppercase" }}>
            We capture the feeling of the room.
          </div>
          <div style={{ marginTop: 28, fontSize: 32, color: "#2dff8a", letterSpacing: 6, textTransform: "uppercase" }}>
            Videography & Photography
          </div>
        </div>
      </div>
    ),
    size,
  );
}
