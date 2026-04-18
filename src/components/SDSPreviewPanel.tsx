"use client";

import dynamic from "next/dynamic";
import { ExternalLink } from "lucide-react";
import { SDSData } from "@/lib/pubchem";
import { SDSTemplate } from "./pdf/SDSTemplate";
import { PDFExportButton } from "./pdf/PDFExportButton";
import { SDSEditor } from "./SDSEditor";
import { reorderFormula } from "@/lib/formulaUtils";
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";

function ChemicalFormulaHtml({ formula }: { formula: string }) {
  if (!formula) return null;

  // Reorder from Hill notation to conventional notation
  const reordered = reorderFormula(formula);

  const items = [];
  const regex = /([a-zA-Z\]\)])(\d+)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(reordered)) !== null) {
    const precedingText = reordered.slice(lastIndex, match.index + match[1].length);
    if (precedingText) items.push({ text: precedingText, sub: false });
    items.push({ text: match[2], sub: true });
    lastIndex = regex.lastIndex;
  }
  const remainingText = reordered.slice(lastIndex);
  if (remainingText) items.push({ text: remainingText, sub: false });

  return (
    <>
      {items.map((item, i) =>
        item.sub ? <sub key={i}>{item.text}</sub> : <span key={i}>{item.text}</span>
      )}
    </>
  );
}

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

export const SDSPreviewPanel = ({ data }: { data: SDSData }) => {
  const [editedData, setEditedData] = useState<SDSData>(data);
  const [debouncedData] = useDebounce(editedData, 1000);

  useEffect(() => {
    setEditedData(data);
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4 bg-white rounded-lg border border-gray-200 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{editedData.identity.name}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
            {editedData.identity.cas && <span>CAS {editedData.identity.cas}</span>}
            {editedData.identity.formula && (
              <span className="font-mono">
                <ChemicalFormulaHtml formula={editedData.identity.formula} />
              </span>
            )}
            <a
              href={`https://pubchem.ncbi.nlm.nih.gov/compound/${editedData.cid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
            >
              <ExternalLink size={12} />
              CID {editedData.cid}
            </a>
          </div>
        </div>
        <PDFExportButton key={`export-${debouncedData.cid}-v5`} data={debouncedData} />
      </div>

      <div className="flex flex-col gap-6 w-full">
        <div
          className="rounded-lg border border-gray-200 bg-neutral-200 shadow-inner w-full
                     h-[85vh] min-h-[40rem]"
        >
          <PDFViewer
            key={`viewer-${debouncedData.cid}-v5`}
            width="100%"
            height="100%"
            showToolbar
            className="block w-full h-full border-0"
            style={{ width: "100%", height: "100%", border: "none" }}
          >
            <SDSTemplate data={debouncedData} />
          </PDFViewer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm w-full">
          <SDSEditor data={editedData} onChange={setEditedData} />
        </div>
      </div>
    </div>
  );
};
