import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { v4 as uuid } from "uuid";

async function verifyOwnership(req: NextRequest, cleanPlate: string) {
  const user = await getAuthUser(req);
  if (!user) return { error: "Unauthorized", status: 401 };

  const { data: car } = await supabase
    .from("cars")
    .select("user_id")
    .eq("plate", cleanPlate)
    .single();

  if (car?.user_id && car.user_id !== user.id) {
    return { error: "Forbidden", status: 403 };
  }
  return { user };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ plate: string }> }
) {
  const { plate } = await params;
  const cleanPlate = decodeURIComponent(plate).toUpperCase().replace(/\s+/g, "");

  const { data: records, error } = await supabase
    .from("service_records")
    .select("*")
    .eq("plate", cleanPlate)
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ records: records || [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ plate: string }> }
) {
  const { plate } = await params;
  const cleanPlate = decodeURIComponent(plate).toUpperCase().replace(/\s+/g, "");

  const auth = await verifyOwnership(req, cleanPlate);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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

  const { data: car } = await supabase
    .from("cars")
    .select("plate")
    .eq("plate", cleanPlate)
    .single();

  if (!car) {
    return NextResponse.json({ error: "Car not found. Register the car first." }, { status: 404 });
  }

  const id = uuid();
  const { error: insertError } = await supabase.from("service_records").insert({
    id,
    plate: cleanPlate,
    service_date,
    odometer: odometer || null,
    service_type,
    description: description || null,
    provider: provider || null,
    cost: cost || null,
    currency: currency || "NZD",
    invoice_filename: invoice_filename || null,
    invoice_path: invoice_path || null,
    notes: notes || null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase
    .from("cars")
    .update({ updated_at: new Date().toISOString() })
    .eq("plate", cleanPlate);

  return NextResponse.json({ id }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ plate: string }> }
) {
  const { plate } = await params;
  const cleanPlate = decodeURIComponent(plate).toUpperCase().replace(/\s+/g, "");

  const auth = await verifyOwnership(req, cleanPlate);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Record id is required" }, { status: 400 });
  }

  const { data: record } = await supabase
    .from("service_records")
    .select("id")
    .eq("id", id)
    .eq("plate", cleanPlate)
    .single();

  if (!record) {
    return NextResponse.json({ error: "Record not found for this plate" }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("service_records")
    .delete()
    .eq("id", id)
    .eq("plate", cleanPlate);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await supabase
    .from("cars")
    .update({ updated_at: new Date().toISOString() })
    .eq("plate", cleanPlate);

  return NextResponse.json({ deleted: id });
}
