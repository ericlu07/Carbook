import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ plate: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plate } = await params;
  const cleanPlate = decodeURIComponent(plate).toUpperCase().replace(/\s+/g, "");
  const body = await req.json();
  const { action } = body;

  const { data: car } = await supabase
    .from("cars")
    .select("user_id")
    .eq("plate", cleanPlate)
    .single();

  if (!car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  if (action === "release") {
    // Only the current owner can release
    if (car.user_id !== user.id) {
      return NextResponse.json({ error: "Only the owner can release this car" }, { status: 403 });
    }

    const { error } = await supabase
      .from("cars")
      .update({ user_id: null, updated_at: new Date().toISOString() })
      .eq("plate", cleanPlate);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ released: true });
  }

  if (action === "claim") {
    // Only allow claiming unclaimed cars
    if (car.user_id) {
      return NextResponse.json({ error: "This car is already owned by someone" }, { status: 403 });
    }

    const { error } = await supabase
      .from("cars")
      .update({ user_id: user.id, updated_at: new Date().toISOString() })
      .eq("plate", cleanPlate);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ claimed: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
