import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { ServiceRecord } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ plate: string }> }
) {
  const { plate } = await params;
  const cleanPlate = decodeURIComponent(plate)
    .toUpperCase()
    .replace(/\s+/g, "");

  // Verify car exists
  const { data: car } = await supabase
    .from("cars")
    .select("plate")
    .eq("plate", cleanPlate)
    .single();

  if (!car) {
    return NextResponse.json(
      { error: "Car not found" },
      { status: 404 }
    );
  }

  // Fetch all service records for this plate
  const { data: records, error } = await supabase
    .from("service_records")
    .select("*")
    .eq("plate", cleanPlate)
    .order("service_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const typedRecords = (records || []) as ServiceRecord[];

  // Build CSV content
  const headers = [
    "Date",
    "Service Type",
    "Description",
    "Provider",
    "Odometer (km)",
    "Cost ($)",
    "Notes",
  ];

  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = typedRecords.map((r) =>
    [
      escapeCSV(r.service_date),
      escapeCSV(r.service_type),
      escapeCSV(r.description),
      escapeCSV(r.provider),
      escapeCSV(r.odometer),
      escapeCSV(r.cost),
      escapeCSV(r.notes),
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${cleanPlate}-service-history.csv"`,
    },
  });
}
