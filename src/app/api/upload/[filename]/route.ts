import { NextRequest, NextResponse } from "next/server";
import path from "path";

// Legacy route - redirects to Supabase Storage public URL
// Old uploads used local filesystem; new uploads go directly to Supabase Storage
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const safe = path.basename(filename);

  // Redirect to Supabase Storage public URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/invoices/${safe}`;

  return NextResponse.redirect(publicUrl);
}
