import type { Metadata } from "next";
import "./globals.css";
import "./print.css";
import ToastProvider from "@/components/Toast";

export const metadata: Metadata = {
  title: "CarBook - Vehicle Service History",
  description:
    "Keep your car's service history organized. Upload invoices, track maintenance, and share your vehicle's complete service record with potential buyers.",
  openGraph: {
    title: "CarBook - Vehicle Service History",
    description: "Look up any car's complete service history by plate number. Free and public.",
    type: "website",
  },
  keywords: ["car service history", "vehicle maintenance", "car invoice tracker", "service records", "car buyer"],
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
        <ToastProvider>
          <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
              <a href="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold text-blue-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/favicon.svg" alt="CarBook logo" width={32} height={32} className="w-7 h-7 sm:w-8 sm:h-8 rounded-md" />
                CarBook
              </a>
              <div className="flex items-center gap-1.5 sm:gap-4">
                <a
                  href="/"
                  className="hidden sm:block text-gray-600 hover:text-blue-600 transition font-medium text-sm sm:text-base"
                >
                  Search
                </a>
                <a
                  href="/browse"
                  className="text-gray-600 hover:text-blue-600 transition font-medium text-sm sm:text-base"
                >
                  Browse
                </a>
                <a
                  href="/add"
                  className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm sm:text-base"
                >
                  <span className="sm:hidden">+ Add</span>
                  <span className="hidden sm:inline">+ Add Record</span>
                </a>
              </div>
            </div>
          </nav>
          <main>{children}</main>
          <footer className="border-t border-gray-200 bg-white mt-16">
            <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
              <p>CarBook &mdash; Your vehicle&apos;s service history, always accessible.</p>
              <p className="mt-1">Look up any car by its plate number. Free and public.</p>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
