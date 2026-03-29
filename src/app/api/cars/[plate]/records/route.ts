import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ plate: string }> }
) {
  const { plate } = await params;
  const cleanPlate = decodeURIComponent(plate).toUpperCase().replace(/\s+/g, "");

  const records = db
    .prepare(
      "SELECT * FROM service_records WHERE plate = ? ORDER BY service_date DESC, created_at DESC"
    )
    .all(cleanPlate);

  return NextResponse.json({ records });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ plate: string }> }
) {
  const { plate } = await params;
  const cleanPlate = decodeURIComponent(plate).toUpperCase().replace(/\s+/g, "");
  const body = await req.json();

  const {
    service_date,
    service_type,
    description,
    provider,
    odometer,
    cost,
    currency,
    invoice_filename,
    invoice_path,
    notes,
  } = body;

  if (!service_date || !service_type) {
    return NextResponse.json(
      { error: "Service date and type are required" },
      { status: 400 }
    );
  }

  // Make sure car exists
  const car = db.prepare("SELECT plate FROM cars WHERE plate = ?").get(cleanPlate);
  if (!car) {
    return NextResponse.json({ error: "Car not found. Register the car first." }, { status: 404 });
  }

  const id = uuid();
  db.prepare(
    `INSERT INTO service_records (id, plate, service_date, odometer, service_type, description, provider, cost, currency, invoice_filename, invoice_path, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    cleanPlate,
    service_date,
    odometer || null,
    service_type,
    description || null,
    provider || null,
    cost || null,
    currency || "NZD",
    invoice_filename || null,
    invoice_path || null,
    notes || null
  );

  // Update car's updated_at
  db.prepare("UPDATE cars SET updated_at = datetime('now') WHERE plate = ?").run(cleanPlate);

  return NextResponse.json({ id }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ plate: string }> }
) {
  const { plate } = await params;
  const cleanPlate = decodeURIComponent(plate).toUpperCase().replace(/\s+/g, "");
  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json(
      { error: "Record id is required" },
      { status: 400 }
    );
  }

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
