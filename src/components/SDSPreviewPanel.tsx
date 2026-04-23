"use client";

import dynamic from "next/dynamic";
import { ExternalLink, FileText, Pencil, Eye, RefreshCw } from "lucide-react";
import { SDSData } from "@/lib/pubchem";
import { SDSTemplate } from "./pdf/SDSTemplate";
import { PDFExportButton } from "./pdf/PDFExportButton";
import { SDSEditor } from "./SDSEditor";
import { reorderFormula } from "@/lib/formulaUtils";
import { useState, useEffect, memo } from "react";
import { useDebounce } from "use-debounce";

const ChemicalFormulaHtml = memo(function ChemicalFormulaHtml({ formula }: { formula: string }) {
  if (!formula) return null;

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
});

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center text-gray-500 text-sm w-full h-full bg-gray-50/50 rounded-xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
          <span>Preparing PDF preview...</span>
        </div>
      </div>
    ),
  }
);

export const SDSPreviewPanel = ({ data }: { data: SDSData }) => {
  const [editedData, setEditedData] = useState<SDSData>(data);
  const [debouncedData] = useDebounce(editedData, 1500);
  const [activeTab, setActiveTab] = useState<"split" | "edit" | "preview">("split");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setEditedData(data);
  }, [data]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleReset = () => setEditedData(data);

  return (
    <div className="w-full space-y-4">
      {/* Info Card */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center">
                <FileText size={20} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 truncate">
                  {editedData?.identity?.name || "Chemical Compound"}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">

                  {editedData.identity.formula && (
                    <span className="font-mono px-2 py-0.5 bg-gray-100 rounded-md">
                      <ChemicalFormulaHtml formula={editedData.identity.formula} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a
              href={`https://pubchem.ncbi.nlm.nih.gov/compound/${editedData.cid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">PubChem</span>

            </a>
            <PDFExportButton key={`export-${debouncedData.cid}`} data={debouncedData} />
          </div>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex p-1 bg-gray-100 rounded-xl max-w-sm">
        {[
          { id: "split", label: "Split", icon: FileText, hideOnMobile: true },
          { id: "edit", label: "Edit", icon: Pencil },
          { id: "preview", label: "Preview", icon: Eye },
        ].map(({ id, label, icon: Icon, hideOnMobile }) => {
          if (hideOnMobile && isMobile) return null;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Editor */}
        {(activeTab === "split" || activeTab === "edit") && (
          <div className={`${activeTab === "edit" ? "w-full" : "w-full lg:w-1/2"} flex flex-col transition-all duration-300`}>
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col h-[600px] lg:h-[calc(100vh-280px)]">
              {/* Editor Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Pencil size={16} className="text-amber-500" />
                  <h3 className="font-semibold text-gray-900">Editor</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Reset to original data"
                  >
                    <RefreshCw size={12} />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                  <span className="text-xs text-gray-400">Auto-saves</span>
                </div>
              </div>
              
              {/* Editor Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                <SDSEditor data={editedData} onChange={setEditedData} />
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {(activeTab === "split" || activeTab === "preview") && (
          <div className={`${activeTab === "preview" ? "w-full" : "w-full lg:w-1/2"} flex flex-col transition-all duration-300`}>
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col h-[600px] lg:h-[calc(100vh-280px)]">
              {/* Preview Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-amber-500" />
                  <h3 className="font-semibold text-gray-900">Live Preview</h3>
                </div>
                <span className="text-xs text-gray-400">PDF format</span>
              </div>
              
              {/* Preview Content */}
              <div className="flex-1 p-4 bg-gray-50/30">
                <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 bg-white shadow-inner">
                  <PDFViewer
                    key={`viewer-${debouncedData.cid}-${JSON.stringify(debouncedData).length}`}
                    width="100%"
                    height="100%"
                    showToolbar
                    className="block w-full h-full border-0"
                  >
                    <SDSTemplate data={debouncedData} />
                  </PDFViewer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
