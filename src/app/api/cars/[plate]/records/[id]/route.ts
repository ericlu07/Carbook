import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ plate: string; id: string }> }
) {
  const { plate, id } = await params;
  const cleanPlate = decodeURIComponent(plate).toUpperCase().replace(/\s+/g, "");

  // Verify the record exists and belongs to this plate
  const record = db
    .prepare("SELECT id FROM service_records WHERE id = ? AND plate = ?")
    .get(id, cleanPlate);

  if (!record) {
    return NextResponse.json(
      { error: "Record not found for this plate" },
      { status: 404 }
    );
  }

  db.prepare("DELETE FROM service_records WHERE id = ? AND plate = ?").run(id, cleanPlate);

  // Update car's updated_at
  db.prepare("UPDATE cars SET updated_at = datetime('now') WHERE plate = ?").run(cleanPlate);

  return NextResponse.json({ deleted: id });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ plate: string; id: string }> }
) {
  const { plate, id } = await params;
  const cleanPlate = decodeURIComponent(plate).toUpperCase().replace(/\s+/g, "");
  const body = await req.json();

  const record = db
    .prepare("SELECT id FROM service_records WHERE id = ? AND plate = ?")
    .get(id, cleanPlate);

  if (!record) {
    return NextResponse.json(
      { error: "Record not found for this plate" },
      { status: 404 }
    );
  }

  const {
    service_date,
    service_type,
    description,
    provider,
    odometer,
    cost,
    invoice_filename,
    invoice_path,
    notes,
  } = body;

  db.prepare(
    `UPDATE service_records SET
      service_date = COALESCE(?, service_date),
      service_type = COALESCE(?, service_type),
      description = ?,
      provider = ?,
      odometer = ?,
      cost = ?,
      invoice_filename = COALESCE(?, invoice_filename),
      invoice_path = COALESCE(?, invoice_path),
      notes = ?
    WHERE id = ? AND plate = ?`
  ).run(
    service_date || null,
    service_type || null,
    description ?? null,
    provider ?? null,
    odometer || null,
    cost || null,
    invoice_filename || null,
    invoice_path || null,
    notes ?? null,
    id,
    cleanPlate
  );

  db.prepare("UPDATE cars SET updated_at = datetime('now') WHERE plate = ?").run(cleanPlate);

  return NextResponse.json({ updated: id });
}
