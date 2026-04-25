"use client";

import dynamic from "next/dynamic";
import { ExternalLink, FileText, Pencil, Eye, RefreshCw, X } from "lucide-react";
import { SDSData } from "@/lib/pubchem";
import { SDSTemplate } from "./pdf/SDSTemplate";
import { PDFExportButton } from "./pdf/PDFExportButton";
import { SDSEditor } from "./SDSEditor";
import { reorderFormula } from "@/lib/formulaUtils";
import { useState, useEffect, memo } from "react";
import { useDebounce } from "use-debounce";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ChemicalFormulaHtml = memo(function ChemicalFormulaHtml({ formula }: { formula: string }) {
  if (!formula) return null;

  const reordered = reorderFormula(formula);
  const items: { text: string; sub: boolean }[] = [];
  const regex = /([a-zA-Z\]\)])(\\d+)/g;
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
      <div className="flex items-center justify-center text-brand-text-muted text-sm w-full h-full bg-gray-50/50 rounded-xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-secondary rounded-full animate-spin" />
          <span>Preparing PDF preview…</span>
        </div>
      </div>
    ),
  }
);

// ─── Component ───────────────────────────────────────────────────────────────

interface SDSPreviewPanelProps {
  data: SDSData;
  onClear?: () => void;
}

export const SDSPreviewPanel = ({ data, onClear }: SDSPreviewPanelProps) => {
  const [editedData, setEditedData] = useState<SDSData>(data);
  const [debouncedData] = useDebounce(editedData, 1500);
  const [activeTab, setActiveTab] = useState<"split" | "edit" | "preview">("split");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => setEditedData(data), [data]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setActiveTab(prev => prev === "split" ? "preview" : prev);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleReset = () => setEditedData(data);

  const tabs: Array<{ id: string; label: string; icon: React.ElementType; hideOnMobile?: boolean }> = [
    { id: "split", label: "Split", icon: FileText, hideOnMobile: true },
    { id: "preview", label: "Preview", icon: Eye },
    { id: "edit", label: "Edit", icon: Pencil },
  ];

  return (
    <div className="w-full space-y-5">
      {/* ── Compound info bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        {/* Identity */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-brand-text truncate leading-tight">
              {editedData?.identity?.name || "Chemical Compound"}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {editedData.identity.formula && (
                <span className="font-mono text-xs text-brand-text-muted">
                  <ChemicalFormulaHtml formula={editedData.identity.formula} />
                </span>
              )}
              <span className="text-xs text-brand-text-muted/60">CID: {editedData.cid}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={`https://pubchem.ncbi.nlm.nih.gov/compound/${editedData.cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand-text-muted hover:text-accent hover:bg-accent/5 rounded-full transition-colors"
          >
            <ExternalLink size={14} />
            <span className="hidden md:inline">PubChem</span>
          </a>
          <div className="w-px h-4 bg-brand-border mx-1" />
          <PDFExportButton key={`export-${debouncedData.cid}`} data={debouncedData} />
          {onClear && (
            <>
              <div className="w-px h-4 bg-brand-border mx-1" />
              <button
                onClick={onClear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand-text-muted hover:text-secondary hover:bg-secondary/5 rounded-full transition-colors"
                title="Clear results"
              >
                <X size={14} />
                <span className="hidden md:inline">Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── View switcher ── */}
      <div className="flex p-1 bg-gray-100 rounded-xl max-w-sm">
        {tabs.map(({ id, label, icon: Icon, hideOnMobile }) => {
          if (hideOnMobile && isMobile) return null;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={[
                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                activeTab === id
                  ? "bg-brand-surface text-brand-text shadow-sm"
                  : "text-brand-text-muted hover:text-brand-text",
              ].join(" ")}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Content area ── */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Editor pane */}
        {(activeTab === "split" || activeTab === "edit") && (
          <div className={`${activeTab === "edit" ? "w-full" : "w-full lg:w-1/2"} flex flex-col transition-all duration-300`}>
            <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden flex flex-col h-[600px] lg:h-[calc(100vh-280px)]">
              {/* Editor header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Pencil size={16} className="text-accent" />
                  <h3 className="font-semibold text-brand-text">Editor</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-brand-text-muted hover:text-brand-text hover:bg-gray-100 rounded-lg transition-colors"
                    title="Reset to original data"
                  >
                    <RefreshCw size={12} />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                  <span className="text-xs text-gray-400">Auto-saves</span>
                </div>
              </div>

              {/* Editor content */}
              <div className="flex-1 p-4 overflow-y-auto">
                <SDSEditor data={editedData} onChange={setEditedData} />
              </div>
            </div>
          </div>
        )}

        {/* Preview pane */}
        {(activeTab === "split" || activeTab === "preview") && (
          <div className={`${activeTab === "preview" ? "w-full" : "w-full lg:w-1/2"} flex flex-col transition-all duration-300`}>
            <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden flex flex-col h-[600px] lg:h-[calc(100vh-280px)]">
              {/* Preview header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-accent" />
                  <h3 className="font-semibold text-brand-text">Live Preview</h3>
                </div>
                <span className="text-xs text-gray-400">PDF format</span>
              </div>

              {/* Preview content */}
              <div className="flex-1 p-4 bg-gray-50/30">
                <div className="w-full h-full rounded-xl overflow-hidden border border-brand-border bg-white shadow-inner">
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
