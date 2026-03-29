"use client";

interface Props {
  records: { service_type: string; cost: number | null }[];
}

interface CostByType {
  service_type: string;
  total: number;
}

const BAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-lime-500",
  "bg-fuchsia-500",
];

export default function CostBreakdown({ records }: Props) {
  // Aggregate costs by service type
  const costMap = new Map<string, number>();
  for (const r of records) {
    if (r.cost == null || r.cost <= 0) continue;
    costMap.set(r.service_type, (costMap.get(r.service_type) ?? 0) + r.cost);
  }

  // Sort by highest cost first
  const sorted: CostByType[] = Array.from(costMap.entries())
    .map(([service_type, total]) => ({ service_type, total }))
    .sort((a, b) => b.total - a.total);

  if (sorted.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4">
        No cost data available.
      </div>
    );
  }

  const maxCost = sorted[0].total;
  const grandTotal = sorted.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Cost Breakdown by Service Type
        </h3>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Total: ${grandTotal.toFixed(2)}
        </span>
      </div>

      <div className="space-y-2">
        {sorted.map((item, index) => {
          const widthPercent = (item.total / maxCost) * 100;
          const color = BAR_COLORS[index % BAR_COLORS.length];

          return (
            <div key={item.service_type} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 truncate mr-2">
                  {item.service_type}
                </span>
                <span className="text-gray-800 dark:text-gray-200 font-medium whitespace-nowrap">
                  ${item.total.toFixed(2)}
                </span>
              </div>
              <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} transition-all duration-500`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
