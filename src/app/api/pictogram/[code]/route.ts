/**
 * Next.js API route — proxies a GHS pictogram PNG from Wikimedia Commons.
 * This solves @react-pdf/renderer's inability to render CORS-limited SVG URLs directly.
 * Usage in PDF: src="/api/pictogram/GHS02" (resolved to full URL client-side)
 */

import { NextRequest, NextResponse } from "next/server";
import { GHS_PICTOGRAMS_PNG } from "@/lib/ghsMapping";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const upstreamUrl = GHS_PICTOGRAMS_PNG[code];

  if (!upstreamUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const res = await fetch(upstreamUrl, {
      headers: { "User-Agent": "ProjectMay-SDS-Generator/1.0" },
      next: { revalidate: 86400 }, // cache for 24h
    });

    if (!res.ok) {
      return new NextResponse("Upstream error", { status: 502 });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Fetch failed", { status: 500 });
  }
}
