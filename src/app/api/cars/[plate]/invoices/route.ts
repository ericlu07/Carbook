import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function PUT(
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

  if (!car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  if (car.user_id !== user.id && !user.isAdmin) {
    return NextResponse.json({ error: "Only the owner can change invoice visibility" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "set_public") {
    // Make invoices permanently public
    const { error } = await supabase
      .from("cars")
      .update({
        invoices_public: true,
        invoices_public_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq("plate", cleanPlate);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, invoices_public: true });

  } else if (action === "set_private") {
    // Make invoices private
    const { error } = await supabase
      .from("cars")
      .update({
        invoices_public: false,
        invoices_public_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq("plate", cleanPlate);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, invoices_public: false });

  } else if (action === "temp_public") {
    // Make invoices public for 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("cars")
      .update({
        invoices_public: false,
        invoices_public_until: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("plate", cleanPlate);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, invoices_public: false, invoices_public_until: expiresAt });

  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}
