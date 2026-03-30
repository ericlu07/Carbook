"use client";

import { useAuth } from "./AuthProvider";

export default function NavAddButton() {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  return (
    <a
      href="/add"
      className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
    >
      <span className="hidden sm:inline">+ Add Car</span>
      <span className="sm:hidden">+ Car</span>
    </a>
  );
}
