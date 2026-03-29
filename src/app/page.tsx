"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/timeago";

interface CarSummary {
  plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  record_count: number;
  last_service_date?: string;
}

export default function HomePage() {
  const [plate, setPlate] = useState("");
  const [searchResults, setSearchResults] = useState<CarSummary[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentCars, setRecentCars] = useState<CarSummary[]>([]);
  const [stats, setStats] = useState({ total_cars: 0, total_records: 0, total_value: 0 });
  const [suggestions, setSuggestions] = useState<CarSummary[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(null);
  const router = useRouter();

  // Live search suggestions with debounce
  const fetchSuggestions = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/cars?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.cars || []);
        setShowSuggestions((data.cars || []).length > 0);
      }
    }, 250);
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setRecentCars(data.recentCars || []);
        setStats(data.stats || { total_cars: 0, total_records: 0, total_value: 0 });
      })
      .catch(() => {});
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = plate.trim().toUpperCase().replace(/\s+/g, "");
    if (!cleaned) return;

    setLoading(true);
    const res = await fetch(`/api/cars/${encodeURIComponent(cleaned)}`);
    if (res.ok) {
      router.push(`/car/${encodeURIComponent(cleaned)}`);
      return;
    }

    const searchRes = await fetch(`/api/cars?q=${encodeURIComponent(cleaned)}`);
    if (searchRes.ok) {
      const data = await searchRes.json();
      setSearchResults(data.cars);
    }
    setSearched(true);
    setLoading(false);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-visible relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 text-center">
          <p className="text-sm text-blue-200 italic mb-6 tracking-wide">The only <span className="font-semibold text-white">ONE</span> service history <span className="font-semibold text-white">BOOK</span> you will ever need</p>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">
            Your Car&apos;s Service History,
            <br />
            <span className="text-blue-200">Always Accessible</span>
          </h1>
          <p className="text-base sm:text-xl text-blue-100 mb-8 sm:mb-10 max-w-2xl mx-auto">
            No more digging through emails for invoices. Upload your service
            records and keep a complete maintenance history for any vehicle —
            searchable by plate number.
          </p>

          {/* Search Box */}
          <div className="max-w-lg mx-auto relative" ref={suggestionsRef}>
            <form onSubmit={handleSearch}>
              <div className="flex bg-white rounded-xl overflow-hidden shadow-2xl">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => {
                      setPlate(e.target.value);
                      setSelectedIdx(-1);
                      fetchSuggestions(e.target.value.trim().toUpperCase());
                    }}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onKeyDown={(e) => {
                      if (!showSuggestions || suggestions.length === 0) return;
                      const max = Math.min(suggestions.length, 5);
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSelectedIdx((i) => (i + 1) % max);
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSelectedIdx((i) => (i <= 0 ? max - 1 : i - 1));
                      } else if (e.key === "Enter" && selectedIdx >= 0) {
                        e.preventDefault();
                        const car = suggestions[selectedIdx];
                        router.push(`/car/${encodeURIComponent(car.plate)}`);
                        setShowSuggestions(false);
                      } else if (e.key === "Escape") {
                        setShowSuggestions(false);
                      }
                    }}
                    placeholder="Enter plate number or VIN"
                    className="w-full px-5 py-4 text-gray-900 text-lg placeholder-gray-400 focus:outline-none"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-800 text-white px-8 py-4 font-semibold text-lg transition disabled:opacity-50"
                >
                  {loading ? "..." : "Search"}
                </button>
              </div>
            </form>

            {/* Live Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                {suggestions.slice(0, 5).map((car, idx) => (
                  <a
                    key={car.plate}
                    href={`/car/${encodeURIComponent(car.plate)}`}
                    className={`flex items-center justify-between px-5 py-3 transition border-b border-gray-100 last:border-0 ${
                      idx === selectedIdx
                        ? "bg-blue-50"
                        : "hover:bg-blue-50"
                    }`}
                    onClick={() => setShowSuggestions(false)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-mono font-bold text-sm">
                        {car.plate}
                      </span>
                      <span className="text-gray-800 font-medium">
                        {car.year} {car.make} {car.model}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {car.record_count} record{car.record_count !== 1 ? "s" : ""}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {searched && searchResults.length === 0 && (
            <div className="mt-6 bg-white/10 dark:bg-black/20 backdrop-blur rounded-xl p-6 max-w-lg mx-auto">
              <p className="text-blue-100">
                No car found for &quot;{plate.trim().toUpperCase()}&quot;. Try searching by plate number or VIN.
              </p>
              <a
                href="/add"
                className="inline-block mt-3 bg-white text-blue-700 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                Be the first to add a record
              </a>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mt-6 max-w-lg mx-auto">
              {searchResults.map((car) => (
                <a
                  key={car.plate}
                  href={`/car/${encodeURIComponent(car.plate)}`}
                  className="flex items-center justify-between bg-white/10 dark:bg-white/5 backdrop-blur rounded-xl p-4 mb-2 hover:bg-white/20 dark:hover:bg-white/10 transition"
                >
                  <div className="text-left">
                    <span className="font-bold text-lg">{car.plate}</span>
                    <span className="ml-3 text-blue-200">
                      {car.year} {car.make} {car.model}
                    </span>
                  </div>
                  <span className="text-blue-200 text-sm">
                    {car.record_count} record{car.record_count !== 1 ? "s" : ""}
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Platform Stats */}
          {stats.total_cars > 0 && (
            <div className="flex justify-center gap-8 mt-12 text-blue-100">
              <div>
                <p className="text-3xl font-bold text-white">{stats.total_cars}</p>
                <p className="text-sm">Cars Registered</p>
              </div>
              <div className="w-px bg-blue-400/30"></div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.total_records}</p>
                <p className="text-sm">Service Records</p>
              </div>
              <div className="w-px bg-blue-400/30"></div>
              <div>
                <p className="text-3xl font-bold text-white">
                  ${Math.round(stats.total_value).toLocaleString()}
                </p>
                <p className="text-sm">In Services Tracked</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recently Added Cars */}
      {recentCars.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Recently Updated</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {recentCars.map((car) => (
              <a
                key={car.plate}
                href={`/car/${encodeURIComponent(car.plate)}`}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 transition group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-lg font-mono font-bold text-sm tracking-wider">
                    {car.plate}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {car.record_count} record{car.record_count !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {car.year} {car.make} {car.model}
                </p>
                {car.color && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{car.color}</p>
                )}
                {car.last_service_date && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Last serviced {timeAgo(car.last_service_date)}
                  </p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-black">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">Register Your Car</h3>
            <p className="text-gray-700">
              Enter your plate number and basic vehicle details to create your
              car&apos;s digital service book.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">Upload Invoices</h3>
            <p className="text-gray-700">
              Got a service invoice? Upload it along with the service details.
              PDF, images — whatever you have.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">Share With Buyers</h3>
            <p className="text-gray-700">
              When selling, just share the plate number. Buyers can look up the
              full service history instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white dark:bg-gray-800 py-16 transition-colors">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">
            Why Use CarBook?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "For Sellers",
                desc: "A well-documented service history increases your car's value. Show buyers you've taken care of it.",
                icon: "💰",
              },
              {
                title: "For Buyers",
                desc: "Check any car's maintenance history before buying. Know exactly what you're getting.",
                icon: "🔍",
              },
              {
                title: "Never Lose a Receipt",
                desc: "No more digging through emails or glove boxes. Every invoice in one place, forever.",
                icon: "📄",
              },
              {
                title: "Free & Public",
                desc: "Anyone can look up a car's service history. Transparency builds trust in the used car market.",
                icon: "🌐",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 p-6 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500 hover:shadow-md transition"
              >
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
