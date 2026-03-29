import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

// Generate a temporary signed URL for an invoice (24 hours)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  const { recordId } = await params;

  // Find the record and its invoice path
  const { data: record, error } = await supabase
    .from("service_records")
    .select("invoice_path, invoice_filename")
    .eq("id", recordId)
    .single();

  if (error || !record || !record.invoice_path) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }

  // Extract the storage filename from the path
  // invoice_path could be a full Supabase URL or just a storage key
  let storageKey = record.invoice_path;

  // If it's a full Supabase URL, extract the filename
  if (storageKey.includes("/storage/v1/object/public/invoices/")) {
    storageKey = storageKey.split("/storage/v1/object/public/invoices/").pop()!;
  } else if (storageKey.includes("/api/upload/")) {
    // Legacy local upload path like /api/upload/uuid.pdf
    storageKey = storageKey.split("/api/upload/").pop()!;
  }

  // Generate a signed URL valid for 24 hours (86400 seconds)
  const { data: signedData, error: signError } = await supabase.storage
    .from("invoices")
    .createSignedUrl(storageKey, 86400);

  if (signError || !signedData) {
    return NextResponse.json(
      { error: "Could not generate download link" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: signedData.signedUrl,
    filename: record.invoice_filename,
    expiresIn: "24 hours",
  });
}
