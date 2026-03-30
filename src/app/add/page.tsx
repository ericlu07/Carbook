"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useToast } from "@/components/Toast";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/api";

export default function AddCarPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-8">Loading...</div>}>
      <AddCarForm />
    </Suspense>
  );
}

function AddCarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const prefillPlate = searchParams.get("plate") || "";

  const [plate, setPlate] = useState(prefillPlate);
  const [carExists, setCarExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Car fields
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [vin, setVin] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent("/add" + (prefillPlate ? `?plate=${prefillPlate}` : ""))}`);
    }
  }, [authLoading, user, router, prefillPlate]);

  // Check if car exists when plate changes
  useEffect(() => {
    async function checkCar() {
      if (plate.length < 2) {
        setCarExists(false);
        return;
      }
      const cleanPlate = plate.trim().toUpperCase().replace(/\s+/g, "");
      const res = await fetch(`/api/cars/${encodeURIComponent(cleanPlate)}`);
      if (res.ok) {
        const data = await res.json();
        setCarExists(true);
        setMake(data.car.make || "");
        setModel(data.car.model || "");
        setYear(data.car.year?.toString() || "");
        setColor(data.car.color || "");
        setVin(data.car.vin || "");
      } else {
        setCarExists(false);
      }
    }
    checkCar();
  }, [plate]);

  // Show loading while checking auth
  if (authLoading || !user) {
    return <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-500">Checking login...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanPlate = plate.trim().toUpperCase().replace(/\s+/g, "");

    const res = await authFetch("/api/cars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plate: cleanPlate,
        make,
        model,
        year: year ? parseInt(year) : null,
        color,
        vin,
        owner_name: "",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to register car");
      setLoading(false);
      return;
    }

    toast(carExists ? "Car updated!" : "Car registered!");
    router.push(`/car/${encodeURIComponent(cleanPlate)}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">
        {carExists ? "Update Car" : "Add a Car"}
      </h1>
      <p className="text-gray-600 mb-8">
        {carExists
          ? "Update this car's details below."
          : "Enter your car's details to register it on CarBook."}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plate Number *
          </label>
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="e.g. ABC123"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono"
            required
          />
          {carExists && (
            <p className="mt-1 text-sm text-green-600">
              This car is already registered. You can update its details below.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Make *
            </label>
            <input
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="e.g. Toyota"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model *
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. Camry"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2020"
              min="1900"
              max="2030"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Silver"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VIN (optional)
          </label>
          <input
            type="text"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="Vehicle Identification Number"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-lg"
        >
          {loading
            ? "Saving..."
            : carExists
            ? "Update Car"
            : "Register Car"}
        </button>
      </form>
    </div>
  );
}
