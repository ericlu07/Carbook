"use client";

import { useAuth } from "./AuthProvider";

export default function AuthButton() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <div className="w-16 h-8 bg-gray-100 rounded-lg animate-pulse"></div>;
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="border border-gray-300 text-gray-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
      >
        Log in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <a
        href="/dashboard"
        className="text-gray-500 hover:text-blue-600 transition p-1.5 sm:p-2"
        title="My Cars"
        aria-label="My Cars dashboard"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0h4m-4 0H9m5 0a1 1 0 001 1h2a1 1 0 001-1v-5a1 1 0 00-.3-.7l-4-4A1 1 0 0013.4 6H13" />
        </svg>
      </a>
      <button
        onClick={() => signOut()}
        className="text-gray-500 hover:text-red-500 transition p-1.5 sm:p-2"
        title="Log out"
        aria-label="Log out"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  );
}
