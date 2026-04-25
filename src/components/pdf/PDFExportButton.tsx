"use client";

import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import { SDSData } from "@/lib/pubchem";
import { SDSTemplate } from "./SDSTemplate";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <button
        disabled
        className="flex items-center gap-2 bg-secondary/10 text-accent/50 text-sm font-semibold px-4 py-2 rounded-lg cursor-not-allowed"
      >
        <Download size={14} />
        Loading…
      </button>
    ),
  }
);

export const PDFExportButton = ({ data }: { data: SDSData }) => {
  const filename = `SDS_${data.identity.name.replace(/\s+/g, "_")}_${data.identity.cas || data.cid}.pdf`;
  const dataHash = `${data.cid}-${JSON.stringify(data).length}`;

  return (
    <PDFDownloadLink
      key={`download-${dataHash}`}
      document={<SDSTemplate data={data} />}
      fileName={filename}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="flex items-center gap-2 bg-secondary hover:bg-accent-dark text-white text-sm font-semibold
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
