import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
export const alt = "behind — Build what’s next.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  const logo = await readFile(
    path.join(process.cwd(), "public/brand/logo-dark.jpg"),
  );
  return new ImageResponse(
    <div
      style={{
        background: "#000",
        color: "#fff",
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "64px 72px",
        justifyContent: "space-between",
      }}
    >
      {/* This renderer embeds the exact supplied asset in the generated social image. */}
      <img
        alt="behind"
        src={`data:image/jpeg;base64,${logo.toString("base64")}`}
        width={300}
        height={100}
      />
      <div
        style={{
          display: "flex",
          fontSize: 108,
          lineHeight: 1,
          letterSpacing: -7,
        }}
      >
        Build what’s next.
      </div>
      <div style={{ fontSize: 18, letterSpacing: 3 }}>
        SOFTWARE TECHNOLOGY & ARTIFICIAL INTELLIGENCE
      </div>
    </div>,
    size,
  );
}
