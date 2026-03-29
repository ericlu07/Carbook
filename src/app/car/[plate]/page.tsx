"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import type { Car, ServiceRecord } from "@/lib/types";
import CostBreakdown from "@/components/CostBreakdown";
import ServiceRecommendations from "@/components/ServiceRecommendations";
import EditRecordModal from "@/components/EditRecordModal";
import MaintenanceScore from "@/components/MaintenanceScore";
import { useToast } from "@/components/Toast";
import { timeAgo } from "@/lib/timeago";

export default function CarPage() {
  const params = useParams();
  const plate = (params.plate as string) || "";
  const [car, setCar] = useState<Car | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const carRes = await fetch(`/api/cars/${encodeURIComponent(plate)}`);
    if (!carRes.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const carData = await carRes.json();
    setCar(carData.car);

    const recRes = await fetch(
      `/api/cars/${encodeURIComponent(plate)}/records`
    );
    if (recRes.ok) {
      const recData = await recRes.json();
      setRecords(recData.records);
    }
    setLoading(false);
  }, [plate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this service record?")) return;
    setDeletingId(recordId);
    const cleanPlate = decodeURIComponent(plate).toUpperCase().replace(/\s+/g, "");
    await fetch(`/api/cars/${encodeURIComponent(cleanPlate)}/records`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: recordId }),
    });
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    setDeletingId(null);
    toast("Record deleted");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${car?.plate} Service History - CarBook`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4 dark:text-gray-100">Car Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          No service history found for plate{" "}
          <span className="font-mono font-bold">
            {decodeURIComponent(plate)}
          </span>
        </p>
        <a
          href="/add"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Add This Car
        </a>
      </div>
    );
  }

  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
  const latestOdometer = records.find((r) => r.odometer)?.odometer;
  const earliestOdometer = [...records].reverse().find((r) => r.odometer)?.odometer;
  const totalKm = latestOdometer && earliestOdometer ? latestOdometer - earliestOdometer : null;

  const lastServiceDate = records.length > 0 ? new Date(records[0].service_date) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Car Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-600 text-white px-4 py-2 rounded-lg font-mono font-bold text-2xl tracking-wider">
                {car?.plate}
              </span>
              {car?.color && (
                <span className="text-gray-500 dark:text-gray-400 text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {car.color}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold dark:text-gray-100">
              {car?.year} {car?.make} {car?.model}
            </h1>
            {car?.vin && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-mono">
                VIN: {car.vin}
              </p>
            )}
            {car?.owner_name && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Owner: {car.owner_name}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/add?plate=${encodeURIComponent(car?.plate || "")}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-center text-sm"
            >
              + Add Record
            </a>
            <button
              onClick={handleShare}
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              {copied ? "Copied!" : "Share"}
            </button>
            <a
              href={`/api/cars/${encodeURIComponent(car?.plate || "")}/export`}
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              Download PDF
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Records</p>
            <p className="text-2xl font-bold dark:text-gray-100">{records.length}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Spent</p>
            <p className="text-2xl font-bold dark:text-gray-100">
              ${totalCost.toLocaleString("en-NZ", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Latest Odometer</p>
            <p className="text-2xl font-bold dark:text-gray-100">
              {latestOdometer
                ? `${latestOdometer.toLocaleString()} km`
                : "---"}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Distance Tracked</p>
            <p className="text-2xl font-bold dark:text-gray-100">
              {totalKm && totalKm > 0
                ? `${totalKm.toLocaleString()} km`
                : "---"}
            </p>
          </div>
        </div>
      </div>

      {/* Maintenance Score */}
      {records.length >= 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <MaintenanceScore records={records} carYear={car?.year || null} />
        </div>
      )}

      {/* Odometer Progress (if we have multiple readings) */}
      {records.filter((r) => r.odometer).length >= 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Odometer History</h3>
          <div className="flex items-end gap-1 h-20">
            {records
              .filter((r) => r.odometer)
              .reverse()
              .map((r) => {
                const maxOdo = Math.max(...records.filter((x) => x.odometer).map((x) => x.odometer!));
                const minOdo = Math.min(...records.filter((x) => x.odometer).map((x) => x.odometer!));
                const range = maxOdo - minOdo || 1;
                const height = ((r.odometer! - minOdo) / range) * 60 + 20;
                return (
                  <div
                    key={r.id}
                    className="flex-1 bg-blue-200 dark:bg-blue-800 hover:bg-blue-400 dark:hover:bg-blue-600 rounded-t transition relative group"
                    style={{ height: `${height}%` }}
                    title={`${r.odometer!.toLocaleString()} km - ${r.service_date}`}
                  >
                    <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {r.odometer!.toLocaleString()} km
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
            <span>{records.filter((r) => r.odometer).reverse()[0]?.service_date}</span>
            <span>{records.filter((r) => r.odometer)[0]?.service_date}</span>
          </div>
        </div>
      )}

      {/* Service Recommendations */}
      {records.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <ServiceRecommendations records={records} />
        </div>
      )}

      {/* Cost Breakdown */}
      {records.some((r) => r.cost && r.cost > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <CostBreakdown records={records} />
        </div>
      )}

      {/* Service Timeline */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold dark:text-gray-100">Service History</h2>
        {records.length > 0 && lastServiceDate && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last service: {lastServiceDate.toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
      </div>

      {records.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No service records yet</p>
          <a
            href={`/add?plate=${encodeURIComponent(car?.plate || "")}`}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Add the first record
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record, idx) => (
            <div
              key={record.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition relative ${
                deletingId === record.id ? "opacity-50" : ""
              }`}
            >
              {idx < records.length - 1 && (
                <div className="absolute left-8 top-full w-0.5 h-4 bg-gray-200 dark:bg-gray-700 z-0"></div>
              )}

              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Date Badge */}
                <div className="flex-shrink-0 text-center md:w-20">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      {new Date(record.service_date).toLocaleDateString(
                        "en-NZ",
                        { month: "short" }
                      )}
                    </p>
                    <p className="text-xl font-bold dark:text-gray-100">
                      {new Date(record.service_date).getDate()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(record.service_date).getFullYear()}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {timeAgo(record.service_date)}
                  </p>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium px-3 py-1 rounded-full mb-2">
                        {record.service_type}
                      </span>
                      {record.description && (
                        <p className="text-gray-700 dark:text-gray-300">{record.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      {record.cost != null && record.cost > 0 && (
                        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          ${record.cost.toLocaleString("en-NZ", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                      <button
                        onClick={() => setEditingRecord(record)}
                        className="text-gray-400 dark:text-gray-500 hover:text-blue-500 transition p-1"
                        title="Edit record"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition p-1"
                        title="Delete record"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    {record.provider && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {record.provider}
                      </span>
                    )}
                    {record.odometer && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {record.odometer.toLocaleString()} km
                      </span>
                    )}
                    {record.invoice_path && (
                      <a
                        href={record.invoice_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        View Invoice ({record.invoice_filename})
                      </a>
                    )}
                  </div>

                  {record.notes && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {record.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          plate={decodeURIComponent(plate)}
          onClose={() => setEditingRecord(null)}
          onSaved={(updated) => {
            setRecords((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            );
            setEditingRecord(null);
            toast("Record updated");
          }}
        />
      )}
    </div>
  );
}
