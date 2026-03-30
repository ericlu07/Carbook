import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ plate: string }> }
) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plate } = await params;
  const cleanPlate = decodeURIComponent(plate).toUpperCase().replace(/\s+/g, "");

  // Verify ownership
  const { data: car } = await supabase
    .from("cars")
    .select("user_id")
    .eq("plate", cleanPlate)
    .single();

  if (!car || (car.user_id !== user.id && !user.isAdmin)) {
    return NextResponse.json({ error: "Not authorized to delete this car" }, { status: 403 });
  }

  // Delete all records first
  await supabase.from("service_records").delete().eq("plate", cleanPlate);

  // Delete the car
  const { error } = await supabase.from("cars").delete().eq("plate", cleanPlate);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ plate: string }> }
) {
  const { plate } = await params;
  const cleanPlate = decodeURIComponent(plate).toUpperCase().replace(/\s+/g, "");

  const { data: car, error } = await supabase
    .from("cars")
    .select("*")
    .eq("plate", cleanPlate)
    .single();

  if (error || !car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  return NextResponse.json({ car });
}
