import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { v4 as uuid } from "uuid";
import path from "path";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = path.extname(file.name) || ".bin";
  const filename = `${uuid()}${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("invoices")
    .upload(filename, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from("invoices")
    .getPublicUrl(filename);

  return NextResponse.json({
    filename: file.name,
    path: urlData.publicUrl,
    size: file.size,
  });
}
