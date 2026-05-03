"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { SDSData } from "@/lib/pubchem";

// The core button logic lives in a separate module so that
// @react-pdf/renderer (which crashes on SSR) is only loaded client-side.
const PDFExportButtonCore = dynamic<{ data: SDSData; fullWidth?: boolean }>(
  () => import("./PDFExportButtonCore"),
  {
    ssr: false,
    loading: () => (
      <button
        disabled
        className="flex items-center justify-center gap-2 bg-secondary hover:bg-accent-dark text-white text-sm font-semibold
                   px-4 py-2 rounded-lg cursor-not-allowed opacity-50"
      >
        <Loader2 size={14} className="animate-spin" />
        Loading…
      </button>
    ),
  },
);

export const PDFExportButton = ({
  data,
  fullWidth = false,
}: {
  data: SDSData;
  fullWidth?: boolean;
}) => <PDFExportButtonCore data={data} fullWidth={fullWidth} />;
