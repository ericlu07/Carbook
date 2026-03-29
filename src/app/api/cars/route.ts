import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";

  if (q) {
    const cars = db
      .prepare(
        `SELECT c.*, COUNT(s.id) as record_count, MAX(s.service_date) as last_service_date
         FROM cars c
         LEFT JOIN service_records s ON c.plate = s.plate
         WHERE c.plate LIKE ? OR c.vin LIKE ?
         GROUP BY c.plate
         ORDER BY c.updated_at DESC
         LIMIT 20`
      )
      .all(`%${q}%`, `%${q}%`);
    return NextResponse.json({ cars });
  }

  const all = req.nextUrl.searchParams.get("all") === "1";
  const cars = db
    .prepare(
      `SELECT c.*, COUNT(s.id) as record_count, MAX(s.service_date) as last_service_date
       FROM cars c
       LEFT JOIN service_records s ON c.plate = s.plate
       GROUP BY c.plate
       ORDER BY c.updated_at DESC${all ? "" : " LIMIT 20"}`
    )
    .all();

  return NextResponse.json({ cars });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { plate, make, model, year, color, vin, owner_name } = body;

  if (!plate || !make || !model) {
    return NextResponse.json(
      { error: "Plate, make, and model are required" },
      { status: 400 }
    );
  }

  const cleanPlate = plate.trim().toUpperCase().replace(/\s+/g, "");

  const existing = db.prepare("SELECT plate FROM cars WHERE plate = ?").get(cleanPlate);
  if (existing) {
    // Update existing car info
    db.prepare(
      `UPDATE cars SET make = ?, model = ?, year = ?, color = ?, vin = ?, owner_name = ?, updated_at = datetime('now')
       WHERE plate = ?`
    ).run(make, model, year || null, color || null, vin || null, owner_name || null, cleanPlate);
  } else {
    db.prepare(
      `INSERT INTO cars (plate, make, model, year, color, vin, owner_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(cleanPlate, make, model, year || null, color || null, vin || null, owner_name || null);
  }

  return NextResponse.json({ plate: cleanPlate }, { status: 201 });
}
