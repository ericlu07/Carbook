import type { Metadata } from "next";
import "./globals.css";
import "./print.css";
import ToastProvider from "@/components/Toast";
import { AuthProvider } from "@/components/AuthProvider";
import AuthButton from "@/components/AuthButton";
import NavAddButton from "@/components/NavAddButton";

export const metadata: Metadata = {
  title: "CarBook - Vehicle Service History",
  description:
    "Keep your car's service history organized. Upload invoices, track maintenance, and share your vehicle's complete service record with potential buyers.",
  openGraph: {
    title: "CarBook - Vehicle Service History",
    description: "Look up any car's complete service history by plate number. Free and public.",
    type: "website",
  },
  keywords: ["car service history", "vehicle maintenance", "car invoice tracker", "service records", "car buyer", "NZ car history", "Australia vehicle records", "WOF history", "used car check"],
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <AuthProvider>
          <ToastProvider>
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <a href="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold text-blue-600">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/favicon.svg" alt="CarBook logo" width={32} height={32} className="w-7 h-7 sm:w-8 sm:h-8 rounded-md" />
                  CarBook
                </a>
                <div className="flex items-center gap-2 sm:gap-3">
                  <a href="/browse" className="text-gray-500 hover:text-blue-600 transition text-sm font-medium hidden sm:block">
                    Browse
                  </a>
                  <NavAddButton />
                  <AuthButton />
                </div>
              </div>
            </nav>
            <main>{children}</main>
            <footer className="border-t border-gray-200 bg-white mt-16">
              <div className="max-w-6xl mx-auto px-4 py-10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/favicon.svg" alt="CarBook" width={24} height={24} className="rounded" />
                    <span className="font-semibold text-gray-700">CarBook</span>
                  </div>
                  <nav className="flex items-center gap-6 text-sm">
                    <a href="/" className="text-gray-500 hover:text-blue-600 transition">Search</a>
                    <a href="/browse" className="text-gray-500 hover:text-blue-600 transition">Browse</a>
                    <a href="/add" className="text-gray-500 hover:text-blue-600 transition">Add Record</a>
                    <a href="/login" className="text-gray-500 hover:text-blue-600 transition">Log in</a>
                  </nav>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100 text-center text-gray-400 text-xs">
                  <p>&copy; {new Date().getFullYear()} CarBook &mdash; Vehicle service history for Australia &amp; New Zealand.</p>
                </div>
              </div>
            </footer>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
