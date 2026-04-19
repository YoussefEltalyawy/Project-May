"use client";

import dynamic from "next/dynamic";
import { ExternalLink, FileText, Pencil, Eye } from "lucide-react";
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
    <div className="w-full px-2">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <FileText size={16} className="text-indigo-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 truncate">{editedData.identity.name}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 ml-10">
              {editedData.identity.cas && (
                <span className="px-2 py-0.5 bg-gray-100 rounded-md font-mono">CAS {editedData.identity.cas}</span>
              )}
              {editedData.identity.formula && (
                <span className="font-mono px-2 py-0.5 bg-gray-100 rounded-md">
                  <ChemicalFormulaHtml formula={editedData.identity.formula} />
                </span>
              )}
              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${editedData.cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
              >
                <ExternalLink size={12} />
                CID {editedData.cid}
              </a>
            </div>
          </div>
          <PDFExportButton key={`export-${debouncedData.cid}-v5`} data={debouncedData} />
        </div>
      </div>

      {/* 50/50 Split Layout: Editor Left, Preview Right */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Left: Editor */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-100">
              <Pencil size={16} className="text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Editor</h3>
              <span className="ml-auto text-xs text-gray-500">Changes auto-save</span>
            </div>
            <div className="flex-1 p-4 min-h-[400px] lg:min-h-[calc(100vh-280px)] max-h-[calc(100vh-200px)]">
              <SDSEditor data={editedData} onChange={setEditedData} />
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
              <Eye size={16} className="text-green-600" />
              <h3 className="font-semibold text-gray-900">Preview</h3>
              <span className="ml-auto text-xs text-gray-500">Live PDF preview</span>
            </div>
            <div className="flex-1 p-4 bg-gray-50/50">
              <div className="rounded-lg border border-gray-200 bg-white shadow-inner w-full h-[400px] lg:h-[calc(100vh-280px)]">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
