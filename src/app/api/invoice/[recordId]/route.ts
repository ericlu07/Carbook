import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// Generate a temporary signed URL for an invoice
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  const { recordId } = await params;

  // Find the record and its invoice path + car plate
  const { data: record, error } = await supabase
    .from("service_records")
    .select("invoice_path, invoice_filename, plate")
    .eq("id", recordId)
    .single();

  if (error || !record || !record.invoice_path) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }

  // Check the car's invoice visibility settings
  const { data: car } = await supabase
    .from("cars")
    .select("user_id, invoices_public, invoices_public_until")
    .eq("plate", record.plate)
    .single();

  if (!car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  // Determine if invoices are currently accessible
  const now = new Date();
  const tempAccessActive = car.invoices_public_until && new Date(car.invoices_public_until) > now;
  const invoicesAccessible = car.invoices_public || tempAccessActive;

  // If invoices are private, only the owner or admin can view
  if (!invoicesAccessible) {
    const user = await getAuthUser(req);
    const isOwner = user && (car.user_id === user.id || user.isAdmin);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Invoices are private. Only the owner can view them." },
        { status: 403 }
      );
    }
  }

  // Extract the storage filename from the path
  let storageKey = record.invoice_path;
  if (storageKey.includes("/storage/v1/object/public/invoices/")) {
    storageKey = storageKey.split("/storage/v1/object/public/invoices/").pop()!;
  } else if (storageKey.includes("/api/upload/")) {
    storageKey = storageKey.split("/api/upload/").pop()!;
  }

  // Generate a signed URL valid for 1 hour (3600 seconds)
  const { data: signedData, error: signError } = await supabase.storage
    .from("invoices")
    .createSignedUrl(storageKey, 3600);

  if (signError || !signedData) {
    return NextResponse.json(
      { error: "Could not generate download link" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: signedData.signedUrl,
    filename: record.invoice_filename,
    expiresIn: "1 hour",
  });
}
