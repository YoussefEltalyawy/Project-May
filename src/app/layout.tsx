import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/Toaster";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fafafa",
};

export const metadata: Metadata = {
  title: "Project May | AI-Powered Safety Data Sheets",
  description:
    "Instantly search 100M+ chemical compounds and generate professional, AI-enhanced Safety Data Sheets. Powered by PubChem and Gemini AI.",
  keywords: ["SDS", "Safety Data Sheet", "chemical", "PubChem", "AI", "PDF", "MSDS", "safety"],
  authors: [{ name: "Project May" }],
  openGraph: {
    title: "Project May | AI-Powered Safety Data Sheets",
    description:
      "Search chemical compounds and generate professional Safety Data Sheets instantly.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project May | AI-Powered Safety Data Sheets",
    description:
      "Search chemical compounds and generate professional Safety Data Sheets instantly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-brand-bg">
        <ErrorBoundary>
          {children}
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
