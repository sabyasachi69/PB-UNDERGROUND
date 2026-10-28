import { ImageResponse } from "next/og";

export const alt = "PB UNDERGROUND — local cloth, campus fits";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<div style={{ display: "flex", width: "100%", height: "100%", padding: 70, background: "#11120f", color: "#f4f0e8", flexDirection: "column", justifyContent: "space-between", fontFamily: "sans-serif" }}><div style={{ display: "flex", alignItems: "center", fontSize: 28, fontWeight: 700 }}><span style={{ display: "flex", background: "#c91e18", padding: "8px 14px", marginRight: 15 }}>PB</span> UNDERGROUND</div><div style={{ display: "flex", flexDirection: "column", fontSize: 102, fontWeight: 900, lineHeight: 0.95, letterSpacing: -5 }}><span>WEAR WHAT</span><span style={{ color: "#f66d60" }}>MOVES WITH YOU.</span></div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, borderTop: "1px solid #888", paddingTop: 18 }}><span>LOCAL CLOTH / CAMPUS RHYTHM</span><span>DROP 001 · LPU</span></div></div>, size);
}
