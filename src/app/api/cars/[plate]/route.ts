import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

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
