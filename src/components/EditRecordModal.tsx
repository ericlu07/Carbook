"use client";

import { useState } from "react";
import { type ServiceRecord } from "@/lib/types";
import { authFetch } from "@/lib/api";

interface Props {
  record: ServiceRecord;
  plate: string;
  onClose: () => void;
  onSaved: (updated: ServiceRecord) => void;
}

export default function EditRecordModal({ record, plate, onClose, onSaved }: Props) {
  const [serviceDate, setServiceDate] = useState(record.service_date);
  const [description, setDescription] = useState(record.description || "");
  const [provider, setProvider] = useState(record.provider || "");
  const [odometer, setOdometer] = useState(record.odometer?.toString() || "");
  const [cost, setCost] = useState(record.cost?.toString() || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let invoiceFilename = record.invoice_filename || null;
    let invoicePath = record.invoice_path || null;

    // Upload file first if a new one was selected
    if (file) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await authFetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        invoiceFilename = uploadData.filename;
        invoicePath = uploadData.path;
      }
      setUploading(false);
    }

    const cleanPlate = plate.toUpperCase().replace(/\s+/g, "");
    const res = await authFetch(
      `/api/cars/${encodeURIComponent(cleanPlate)}/records/${record.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_date: serviceDate,
          service_type: record.service_type,
          description,
          provider,
          odometer: odometer ? parseInt(odometer) : null,
          cost: cost ? parseFloat(cost) : null,
          notes: "",
          invoice_filename: invoiceFilename,
          invoice_path: invoicePath,
        }),
      }
    );

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update record");
      setLoading(false);
      return;
    }

    onSaved({
      ...record,
      service_date: serviceDate,
      service_type: record.service_type,
      description,
      provider,
      odometer: odometer ? parseInt(odometer) : null,
      cost: cost ? parseFloat(cost) : null,
      notes: "",
      invoice_filename: invoiceFilename,
      invoice_path: invoicePath,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold dark:text-gray-100">Edit Service Record</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Odometer</label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Upload Invoice / Receipt
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition ${
                dragging
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.heic"
                className="hidden"
                id="edit-file-upload"
              />
              <label htmlFor="edit-file-upload" className="cursor-pointer">
                {file ? (
                  <div>
                    <p className="text-blue-600 font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    <p className="text-xs text-blue-500 mt-1">Click to change</p>
                  </div>
                ) : record.invoice_filename ? (
                  <div>
                    <p className="text-green-600 font-medium text-sm">Current: {record.invoice_filename}</p>
                    <p className="text-xs text-gray-500 mt-1">Click or drag to replace</p>
                  </div>
                ) : (
                  <div>
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {dragging ? "Drop your file here" : "Click or drag & drop to upload"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG up to 10MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-sm"
            >
              {uploading ? "Uploading..." : loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
