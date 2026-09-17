import { ImageResponse } from "next/og";

export const alt = "AX SEO Manager - SEO, AEO, GEO";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%", padding: 80, background: "#ffffff", color: "#171717" }}>
      <div style={{ display: "flex", fontSize: 64, fontWeight: 800 }}>AX SEO Manager</div>
      <div style={{ display: "flex", marginTop: 32, fontSize: 40, color: "#008568" }}>SEO · AEO · GEO</div>
      <div style={{ display: "flex", marginTop: 24, fontSize: 28 }}>AI Content Optimization &amp; Live Verification</div>
    </div>,
    size,
  );
}
