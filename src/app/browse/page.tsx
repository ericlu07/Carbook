"use client";

import { useEffect, useState } from "react";

import { timeAgo } from "@/lib/timeago";

interface CarSummary {
  plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  record_count: number;
  updated_at: string;
  last_service_date: string | null;
}

type SortKey = "recent" | "records" | "make";

export default function BrowsePage() {
  const [cars, setCars] = useState<CarSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  useEffect(() => {
    fetch("/api/cars?all=1")
      .then((r) => r.json())
      .then((data) => {
        setCars(data.cars || []);
        setLoading(false);
      });
  }, []);

  const filtered = cars
    .filter((c) => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      return (
        c.plate.toLowerCase().includes(q) ||
        c.make.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sort === "records") return b.record_count - a.record_count;
      if (sort === "make") return a.make.localeCompare(b.make);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Browse Cars</h1>
          <p className="text-gray-500 mt-1">
            {cars.length} vehicle{cars.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <a
          href="/add"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition text-center text-sm"
        >
          + Register a Car
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by plate number..."
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-4 py-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="recent">Recently Updated</option>
          <option value="records">Most Records</option>
          <option value="make">Alphabetical (Make)</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          {cars.length === 0 ? (
            <>
              <p className="text-gray-500 text-lg mb-4">
                No cars registered yet
              </p>
              <a
                href="/add"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Add the first car
              </a>
            </>
          ) : (
            <p className="text-gray-500 text-lg">
              No cars match &quot;{filter}&quot;
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">
            Showing {filtered.length} of {cars.length} cars
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((car) => (
              <a
                key={car.plate}
                href={`/car/${encodeURIComponent(car.plate)}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-300 transition group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-lg font-mono font-bold text-sm tracking-wider">
                    {car.plate}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {car.record_count} record{car.record_count !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition">
                  {car.year} {car.make} {car.model}
                </p>
                {car.color && (
                  <p className="text-sm text-gray-500 mt-1">{car.color}</p>
                )}
                {car.last_service_date && (
                  <p className="text-xs text-gray-400 mt-2">
                    Last serviced {timeAgo(car.last_service_date)}
                  </p>
                )}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
