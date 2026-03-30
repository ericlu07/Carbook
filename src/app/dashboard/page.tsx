"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/api";
import { detectPlate } from "@/lib/plates";
import type { Car } from "@/lib/types";

interface CarWithStats extends Car {
  record_count: number;
  last_service_date: string | null;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cars, setCars] = useState<CarWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    async function loadMyCars() {
      const res = await authFetch("/api/my-cars");
      if (res.ok) {
        const data = await res.json();
        setCars(data.cars);
      }
      setLoading(false);
    }
    loadMyCars();
  }, [user]);

  if (authLoading || !user) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Cars</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your registered vehicles
          </p>
        </div>
        <a
          href="/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
        >
          + Add Car
        </a>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-5 w-40 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : cars.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0h4m-4 0H9m5 0a1 1 0 001 1h2a1 1 0 001-1v-5a1 1 0 00-.3-.7l-4-4A1 1 0 0013.4 6H13" />
          </svg>
          <h2 className="text-xl font-bold text-gray-700 mb-2">No cars yet</h2>
          <p className="text-gray-500 mb-6">
            Register your first car and start tracking its service history.
          </p>
          <a
            href="/add"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Register Your First Car
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {cars.map((car) => {
            const plateInfo = detectPlate(car.plate);
            return (
              <a
                key={car.plate}
                href={`/car/${encodeURIComponent(car.plate)}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-mono font-bold text-lg tracking-wider group-hover:bg-blue-700 transition">
                      {car.plate}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {car.year} {car.make} {car.model}
                        </p>
                        {plateInfo.flag && (
                          <span className="text-sm" title={plateInfo.label}>{plateInfo.flag}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                        <span>{car.record_count} record{car.record_count !== 1 ? "s" : ""}</span>
                        {car.color && <span>{car.color}</span>}
                        {car.last_service_date && (
                          <span>Last service: {new Date(car.last_service_date).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
