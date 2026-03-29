"use client";

import { useAuth } from "./AuthProvider";

export default function AuthButton() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>;
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium text-sm sm:text-base"
      >
        Log in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400 max-w-[120px] truncate">
        {user.email}
      </span>
      <button
        onClick={() => signOut()}
        className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium text-sm"
      >
        Log out
      </button>
    </div>
  );
}
