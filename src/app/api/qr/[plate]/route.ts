import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ plate: string }> }
) {
  const { plate } = await params;
  const cleanPlate = decodeURIComponent(plate).toUpperCase().replace(/\s+/g, "");

  // Build the URL for this car's page
  const host = req.headers.get("host") || "localhost:3457";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const url = `${protocol}://${host}/car/${encodeURIComponent(cleanPlate)}`;

  const svg = await QRCode.toString(url, {
    type: "svg",
    width: 300,
    margin: 2,
    color: { dark: "#1e40af", light: "#ffffff" },
  });

  return new NextResponse(svg, {
    headers: { "Content-Type": "image/svg+xml" },
  });
}
