"use client";

interface ServiceRecord {
  service_type: string;
  service_date: string;
  odometer: number | null;
}

interface Props {
  records: ServiceRecord[];
}

const SERVICE_INTERVALS: Record<string, { months: number; km: number }> = {
  "Oil Change": { months: 6, km: 10000 },
  "Tire Rotation": { months: 6, km: 10000 },
  "Full Service": { months: 12, km: 15000 },
  "Brake Service": { months: 24, km: 40000 },
  "WOF/Inspection": { months: 12, km: 0 },
  "Air Filter": { months: 12, km: 20000 },
  "Coolant Flush": { months: 24, km: 50000 },
  "Transmission Service": { months: 36, km: 60000 },
  "Spark Plugs": { months: 36, km: 50000 },
  "Timing Belt": { months: 60, km: 100000 },
  "Cambelt": { months: 60, km: 100000 },
  "AC Service": { months: 24, km: 0 },
};

export default function ServiceRecommendations({ records }: Props) {
  const now = new Date();
  const latestOdometer = records.find((r) => r.odometer)?.odometer || 0;

  const recommendations: {
    service: string;
    status: "overdue" | "due-soon" | "ok";
    lastDate: string | null;
    nextDate: string | null;
    lastKm: number | null;
    nextKm: number | null;
  }[] = [];

  for (const [service, interval] of Object.entries(SERVICE_INTERVALS)) {
    const lastRecord = records.find((r) => r.service_type === service);

    if (!lastRecord) continue; // Only show recommendations for services that have been done

    const lastDate = new Date(lastRecord.service_date);
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + interval.months);

    const lastKm = lastRecord.odometer;
    const nextKm = lastKm && interval.km > 0 ? lastKm + interval.km : null;

    const monthsUntilDue = (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const kmUntilDue = nextKm ? nextKm - latestOdometer : null;

    let status: "overdue" | "due-soon" | "ok" = "ok";
    if (monthsUntilDue < 0 || (kmUntilDue !== null && kmUntilDue < 0)) {
      status = "overdue";
    } else if (monthsUntilDue < 2 || (kmUntilDue !== null && kmUntilDue < 2000)) {
      status = "due-soon";
    }

    recommendations.push({
      service,
      status,
      lastDate: lastRecord.service_date,
      nextDate: nextDate.toISOString().split("T")[0],
      lastKm,
      nextKm,
    });
  }

  // Sort: overdue first, then due-soon, then ok
  const order = { overdue: 0, "due-soon": 1, ok: 2 };
  recommendations.sort((a, b) => order[a.status] - order[b.status]);

  if (recommendations.length === 0) return null;

  const statusColors = {
    overdue: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    "due-soon": "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    ok: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  };

  const statusLabels = {
    overdue: "Overdue",
    "due-soon": "Due Soon",
    ok: "Up to Date",
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Maintenance Schedule
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {recommendations.map((rec) => (
          <div
            key={rec.service}
            className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${statusColors[rec.status]}`}
          >
            <div>
              <span className="font-medium">{rec.service}</span>
              {rec.nextDate && (
                <span className="ml-2 opacity-75 text-xs">
                  Next: {new Date(rec.nextDate).toLocaleDateString("en-NZ", { month: "short", year: "numeric" })}
                  {rec.nextKm ? ` / ${rec.nextKm.toLocaleString()} km` : ""}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20">
              {statusLabels[rec.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
