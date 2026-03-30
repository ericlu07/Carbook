import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: cars, error } = await supabase
    .from("cars")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch record counts and last service dates
  const plates = (cars || []).map((c) => c.plate);
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

  const enrichedCars = (cars || []).map((c) => ({
    ...c,
    record_count: statsMap[c.plate]?.record_count || 0,
    last_service_date: statsMap[c.plate]?.last_service_date || null,
  }));

  return NextResponse.json({ cars: enrichedCars });
}
