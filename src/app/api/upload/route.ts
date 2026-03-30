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

  // Validate file size (max 10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
  }

  // Validate file type
  const ALLOWED_TYPES = [
    "application/pdf",
    "image/png", "image/jpeg", "image/gif", "image/webp", "image/heic",
  ];
  const ext = path.extname(file.name).toLowerCase();
  const ALLOWED_EXTS = [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic"];
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTS.includes(ext)) {
    return NextResponse.json({ error: "Invalid file type. Allowed: PDF, PNG, JPG, GIF, WebP, HEIC." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeExt = path.extname(file.name).toLowerCase() || ".bin";
  const filename = `${uuid()}${safeExt}`;

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
