"use client";

interface Props {
  records: {
    service_type: string;
    service_date: string;
    odometer: number | null;
  }[];
  carYear: number | null;
}

export default function MaintenanceScore({ records, carYear }: Props) {
  if (records.length === 0) return null;

  // Calculate a score out of 100 based on several factors
  let score = 0;
  let maxScore = 0;

  // 1. Record frequency (up to 30 points)
  // Good: at least 2 services per year
  maxScore += 30;
  const years =
    carYear
      ? Math.max(1, new Date().getFullYear() - carYear)
      : Math.max(
          1,
          (Date.now() - new Date(records[records.length - 1]?.service_date).getTime()) /
            (1000 * 60 * 60 * 24 * 365)
        );
  const recordsPerYear = records.length / years;
  score += Math.min(30, Math.round(recordsPerYear * 15));

  // 2. Recency (up to 25 points)
  // Good: service within last 6 months
  maxScore += 25;
  const lastService = new Date(records[0].service_date);
  const monthsSince = (Date.now() - lastService.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsSince <= 3) score += 25;
  else if (monthsSince <= 6) score += 20;
  else if (monthsSince <= 12) score += 10;
  else if (monthsSince <= 18) score += 5;

  // 3. Service variety (up to 20 points)
  // Good: multiple types of service (not just oil changes)
  maxScore += 20;
  const uniqueTypes = new Set(records.map((r) => r.service_type)).size;
  score += Math.min(20, uniqueTypes * 5);

  // 4. Odometer tracking (up to 15 points)
  // Good: consistent odometer entries
  maxScore += 15;
  const withOdometer = records.filter((r) => r.odometer).length;
  const odoPercent = withOdometer / records.length;
  score += Math.round(odoPercent * 15);

  // 5. Consistency (up to 10 points)
  // Good: no large gaps (>12 months) between services
  maxScore += 10;
  let hasLargeGap = false;
  for (let i = 0; i < records.length - 1; i++) {
    const gap =
      new Date(records[i].service_date).getTime() -
      new Date(records[i + 1].service_date).getTime();
    if (gap > 365 * 24 * 60 * 60 * 1000) {
      hasLargeGap = true;
      break;
    }
  }
  if (!hasLargeGap) score += 10;
  else score += 3;

  const finalScore = Math.min(100, Math.round((score / maxScore) * 100));

  let grade = "A+";
  let gradeColor = "text-green-600 dark:text-green-400";
  let ringColor = "stroke-green-500";
  let bgRing = "stroke-green-100 dark:stroke-green-900";

  if (finalScore >= 90) {
    grade = "A+";
    gradeColor = "text-green-600 dark:text-green-400";
    ringColor = "stroke-green-500";
    bgRing = "stroke-green-100 dark:stroke-green-900";
  } else if (finalScore >= 80) {
    grade = "A";
    gradeColor = "text-green-600 dark:text-green-400";
    ringColor = "stroke-green-500";
    bgRing = "stroke-green-100 dark:stroke-green-900";
  } else if (finalScore >= 70) {
    grade = "B";
    gradeColor = "text-blue-600 dark:text-blue-400";
    ringColor = "stroke-blue-500";
    bgRing = "stroke-blue-100 dark:stroke-blue-900";
  } else if (finalScore >= 60) {
    grade = "C";
    gradeColor = "text-yellow-600 dark:text-yellow-400";
    ringColor = "stroke-yellow-500";
    bgRing = "stroke-yellow-100 dark:stroke-yellow-900";
  } else if (finalScore >= 40) {
    grade = "D";
    gradeColor = "text-orange-600 dark:text-orange-400";
    ringColor = "stroke-orange-500";
    bgRing = "stroke-orange-100 dark:stroke-orange-900";
  } else {
    grade = "F";
    gradeColor = "text-red-600 dark:text-red-400";
    ringColor = "stroke-red-500";
    bgRing = "stroke-red-100 dark:stroke-red-900";
  }

  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (finalScore / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      {/* Circular Score */}
      <div className="relative w-24 h-24 flex-shrink-0">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            className={bgRing}
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            className={ringColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${gradeColor}`}>{grade}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{finalScore}/100</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Maintenance Score
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          <span>Service frequency</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {recordsPerYear.toFixed(1)}/yr
          </span>
          <span>Last serviced</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {monthsSince < 1
              ? "This month"
              : `${Math.round(monthsSince)} mo ago`}
          </span>
          <span>Service types</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{uniqueTypes} types</span>
          <span>Odometer tracked</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {Math.round(odoPercent * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
