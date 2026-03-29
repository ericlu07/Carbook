import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM cars) as total_cars,
        (SELECT COUNT(*) FROM service_records) as total_records,
        (SELECT COALESCE(SUM(cost), 0) FROM service_records) as total_value`
    )
    .get() as { total_cars: number; total_records: number; total_value: number };

  const recentCars = db
    .prepare(
      `SELECT c.plate, c.make, c.model, c.year, c.color,
              COUNT(s.id) as record_count,
              MAX(s.service_date) as last_service_date
       FROM cars c
       LEFT JOIN service_records s ON c.plate = s.plate
       GROUP BY c.plate
       ORDER BY c.updated_at DESC
       LIMIT 6`
    )
    .all();

  return NextResponse.json({ stats, recentCars });
}
