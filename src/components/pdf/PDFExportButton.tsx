"use client";

import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import { SDSData } from "@/lib/pubchem";
import { SDSTemplate } from "./SDSTemplate";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then(m => m.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <button disabled className="flex items-center gap-2 bg-gray-100 text-gray-400 text-sm font-semibold px-4 py-2 rounded-lg cursor-not-allowed">
        <Download size={14} />
        Loading…
      </button>
    ),
  }
);

export const PDFExportButton = ({ data }: { data: SDSData }) => {
  const filename = `SDS_${data.identity.name.replace(/\s+/g, "_")}_${data.identity.cas || data.cid}.pdf`;

  return (
    <PDFDownloadLink document={<SDSTemplate data={data} />} fileName={filename}>
      {({ loading }) => (
        <button
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold
                     px-4 py-2 rounded-lg active:scale-95 transition-all duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={14} />
          {loading ? "Building PDF…" : "Export SDS PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
};
