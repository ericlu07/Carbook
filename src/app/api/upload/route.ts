import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { v4 as uuid } from "uuid";
import path from "path";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = path.extname(file.name) || ".bin";
  const filename = `${uuid()}${ext}`;

  // Upload to Supabase Storage (private bucket)
  const { error: uploadError } = await supabase.storage
    .from("invoices")
    .upload(filename, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Store just the storage key as the path (not a public URL since bucket is private)
  return NextResponse.json({
    filename: file.name,
    path: filename,
    size: file.size,
  });
}
