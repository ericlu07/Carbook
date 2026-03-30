"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useAuth } from "@/components/AuthProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { user } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // If already logged in, redirect
  if (user) {
    router.push(redirect);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (mode === "signup") {
      const { error: signUpError } = await supabaseBrowser.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      setSuccess("Account created! You are now logged in.");
      setTimeout(() => router.push(redirect), 1000);
    } else {
      const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      router.push(redirect);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <a href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-blue-600 mb-2">
          <img src="/favicon.svg" alt="CarBook" width={32} height={32} className="rounded-md" />
          CarBook
        </a>
        <p className="text-gray-500">
          {mode === "login" ? "Log in to manage your cars" : "Create an account to get started"}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => { setMode("login"); setError(""); }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
            mode === "login"
              ? "bg-white shadow text-gray-900"
              : "text-gray-500"
          }`}
        >
          Log in
        </button>
        <button
          onClick={() => { setMode("signup"); setError(""); }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
            mode === "signup"
              ? "bg-white shadow text-gray-900"
              : "text-gray-500"
          }`}
        >
          Sign up
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-lg"
        >
          {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      {mode === "login" && (
        <p className="text-center text-sm mt-4">
          <button
            onClick={async () => {
              if (!email) {
                setError("Enter your email address first, then click forgot password.");
                return;
              }
              setLoading(true);
              setError("");
              const { error: resetError } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
              });
              setLoading(false);
              if (resetError) {
                setError(resetError.message);
              } else {
                setSuccess("Password reset email sent! Check your inbox.");
              }
            }}
            className="text-blue-600 font-medium hover:underline"
          >
            Forgot password?
          </button>
        </p>
      )}

      <p className="text-center text-sm text-gray-500 mt-4">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button onClick={() => setMode("signup")} className="text-blue-600 font-medium hover:underline">
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button onClick={() => setMode("login")} className="text-blue-600 font-medium hover:underline">
              Log in
            </button>
          </>
        )}
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-16 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
