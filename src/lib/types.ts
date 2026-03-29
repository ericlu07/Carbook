export interface Car {
  plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  owner_name: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceRecord {
  id: string;
  plate: string;
  service_date: string;
  odometer: number | null;
  service_type: string;
  description: string;
  provider: string;
  cost: number | null;
  currency: string;
  invoice_filename: string | null;
  invoice_path: string | null;
  notes: string;
  created_at: string;
}

export const SERVICE_TYPES = [
  "Oil Change",
  "Tire Rotation",
  "Tire Replacement",
  "Brake Service",
  "Battery Replacement",
  "Transmission Service",
  "Engine Repair",
  "Coolant Flush",
  "Air Filter",
  "Spark Plugs",
  "Timing Belt",
  "Suspension",
  "Wheel Alignment",
  "WOF/Inspection",
  "Registration Renewal",
  "Full Service",
  "Cambelt",
  "Clutch",
  "Exhaust",
  "Electrical",
  "Body Work",
  "Paint",
  "Windscreen",
  "AC Service",
  "Other",
] as const;
