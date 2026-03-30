import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

async function verifyOwnership(req: NextRequest, cleanPlate: string) {
  const user = await getAuthUser(req);
  if (!user) return { error: "Unauthorized", status: 401 };

  const { data: car } = await supabase
    .from("cars")
    .select("user_id")
    .eq("plate", cleanPlate)
    .single();

  if (car?.user_id && car.user_id !== user.id && !user.isAdmin) {
    return { error: "Forbidden", status: 403 };
  }
  return { user };
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ plate: string; id: string }> }
) {
  const { plate, id } = await params;
  const cleanPlate = decodeURIComponent(plate).toUpperCase().replace(/\s+/g, "");

  const auth = await verifyOwnership(req, cleanPlate);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data: record } = await supabase
    .from("service_records")
    .select("id")
    .eq("id", id)
    .eq("plate", cleanPlate)
    .single();

  if (!record) {
    return NextResponse.json(
      { error: "Record not found for this plate" },
      { status: 404 }
    );
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ plate: string; id: string }> }
) {
  const { plate, id } = await params;
  const cleanPlate = decodeURIComponent(plate).toUpperCase().replace(/\s+/g, "");

  const auth = await verifyOwnership(req, cleanPlate);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data: record } = await supabase
    .from("service_records")
    .select("id")
    .eq("id", id)
    .eq("plate", cleanPlate)
    .single();

  if (!record) {
    return NextResponse.json(
      { error: "Record not found for this plate" },
      { status: 404 }
    );
  }

  const body = await req.json();

  const {
    service_date,
    service_type,
    description,
    provider,
    odometer,
    cost,
    invoice_filename,
    invoice_path,
    notes,
  } = body;

  const updateData: Record<string, unknown> = {};
  if (service_date) updateData.service_date = service_date;
  if (service_type) updateData.service_type = service_type;
  if (description !== undefined) updateData.description = description ?? null;
  if (provider !== undefined) updateData.provider = provider ?? null;
  if (odometer !== undefined) updateData.odometer = odometer || null;
  if (cost !== undefined) updateData.cost = cost || null;
  if (invoice_filename) updateData.invoice_filename = invoice_filename;
  if (invoice_path) updateData.invoice_path = invoice_path;
  if (notes !== undefined) updateData.notes = notes ?? null;

  const { error: updateError } = await supabase
    .from("service_records")
    .update(updateData)
    .eq("id", id)
    .eq("plate", cleanPlate);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase
    .from("cars")
    .update({ updated_at: new Date().toISOString() })
    .eq("plate", cleanPlate);

  return NextResponse.json({ updated: id });
}
