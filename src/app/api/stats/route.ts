import { NextResponse } from "next/server";
import supabase from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  // Get total cars count
  const { count: total_cars, error: carsError } = await supabase
    .from("cars")
    .select("*", { count: "exact", head: true });

  if (carsError) {
    return NextResponse.json({ error: carsError.message }, { status: 500 });
  }

  // Get total records count
  const { count: total_records, error: recordsError } = await supabase
    .from("service_records")
    .select("*", { count: "exact", head: true });

  if (recordsError) {
    return NextResponse.json({ error: recordsError.message }, { status: 500 });
  }

  // Get total cost sum
  const { data: costData, error: costError } = await supabase
    .from("service_records")
    .select("cost");

  if (costError) {
    return NextResponse.json({ error: costError.message }, { status: 500 });
  }

  const total_value = (costData || []).reduce(
    (sum, r) => sum + (r.cost || 0),
    0
  );

  const stats = {
    total_cars: total_cars || 0,
    total_records: total_records || 0,
    total_value,
  };

  // Get recent cars with record counts
  const { data: recentCarsRaw, error: recentError } = await supabase
    .from("cars")
    .select("plate, make, model, year, color")
    .order("updated_at", { ascending: false })
    .limit(6);

  if (recentError) {
    return NextResponse.json({ error: recentError.message }, { status: 500 });
  }

  // Fetch record stats for recent cars
  const plates = (recentCarsRaw || []).map((c) => c.plate);
  const { data: recordStats } = await supabase
    .from("service_records")
    .select("plate, id, service_date")
    .in("plate", plates.length > 0 ? plates : [""]);

  const statsMap: Record<string, { record_count: number; last_service_date: string | null }> = {};
  for (const r of recordStats || []) {
    if (!statsMap[r.plate]) {
      statsMap[r.plate] = { record_count: 0, last_service_date: null };
    }
    statsMap[r.plate].record_count++;
    if (!statsMap[r.plate].last_service_date || r.service_date > statsMap[r.plate].last_service_date!) {
      statsMap[r.plate].last_service_date = r.service_date;
    }
  }

  const recentCars = (recentCarsRaw || []).map((c) => ({
    ...c,
    record_count: statsMap[c.plate]?.record_count || 0,
    last_service_date: statsMap[c.plate]?.last_service_date || null,
  }));

  return NextResponse.json({ stats, recentCars });
}
