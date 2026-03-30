import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const all = req.nextUrl.searchParams.get("all") === "1";

  if (q) {
    const { data: cars, error } = await supabase
      .from("cars")
      .select("*")
      .or(`plate.ilike.%${q}%,vin.ilike.%${q}%`)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch record counts and last service dates for these cars
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

  let query = supabase
    .from("cars")
    .select("*")
    .order("updated_at", { ascending: false });

  if (!all) {
    query = query.limit(20);
  }

  const { data: cars, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch record counts and last service dates for all returned cars
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

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { plate, make, model, year, color, vin, owner_name } = body;

  if (!plate || !make || !model) {
    return NextResponse.json(
      { error: "Plate, make, and model are required" },
      { status: 400 }
    );
  }

  const cleanPlate = plate.trim().toUpperCase().replace(/\s+/g, "");

  const { data: existing } = await supabase
    .from("cars")
    .select("plate, user_id")
    .eq("plate", cleanPlate)
    .single();

  if (existing) {
    // If car has an owner and it's not this user, deny
    if (existing.user_id && existing.user_id !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: "This car is owned by another user" }, { status: 403 });
    }

    // Update existing car info and claim if unclaimed
    const { error } = await supabase
      .from("cars")
      .update({
        make,
        model,
        year: year || null,
        color: color || null,
        vin: vin || null,
        owner_name: owner_name || null,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("plate", cleanPlate);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("cars").insert({
      plate: cleanPlate,
      make,
      model,
      year: year || null,
      color: color || null,
      vin: vin || null,
      owner_name: owner_name || null,
      user_id: user.id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ plate: cleanPlate }, { status: 201 });
}
