import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import path from "path";

// Legacy route - generates a signed URL for files in Supabase Storage
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const safe = path.basename(filename);

  // Generate a short-lived signed URL (1 hour)
  const { data, error } = await supabase.storage
    .from("invoices")
    .createSignedUrl(safe, 3600);

  if (error || !data) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
