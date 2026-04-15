"use client";

import dynamic from "next/dynamic";
import { ExternalLink } from "lucide-react";
import { SDSData } from "@/lib/pubchem";
import { SDSTemplate } from "./pdf/SDSTemplate";
import { PDFExportButton } from "./pdf/PDFExportButton";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center text-gray-500 text-sm border border-gray-200 rounded-lg bg-gray-50
                   w-full h-[min(85vh,56rem)] min-h-[28rem] max-h-[calc(100dvh-10rem)]"
      >
        Preparing PDF preview…
      </div>
    ),
  }
);

export const SDSPreviewPanel = ({ data }: { data: SDSData }) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-4 bg-white rounded-lg border border-gray-200 px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 truncate">{data.identity.name}</h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
          {data.identity.cas && <span>CAS {data.identity.cas}</span>}
          {data.identity.formula && <span className="font-mono">{data.identity.formula}</span>}
          <a
            href={`https://pubchem.ncbi.nlm.nih.gov/compound/${data.cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
          >
            <ExternalLink size={12} />
            CID {data.cid}
          </a>
        </div>
      </div>
      <PDFExportButton data={data} />
    </div>

    <div
      className="rounded-lg border border-gray-200 bg-neutral-200 shadow-inner w-full
                 h-[min(85vh,56rem)] min-h-[28rem] max-h-[calc(100dvh-10rem)]"
    >
      <PDFViewer
        width="100%"
        height="100%"
        showToolbar
        className="block w-full h-full border-0"
        style={{ width: "100%", height: "100%", border: "none" }}
      >
        <SDSTemplate data={data} />
      </PDFViewer>
    </div>
  </div>
);
