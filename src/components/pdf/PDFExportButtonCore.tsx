"use client";

import { usePDF } from "@react-pdf/renderer";
import { Download, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { SDSData } from "@/lib/pubchem";
import { SDSTemplate } from "./SDSTemplate";
import { useEffect, useRef, useState, useCallback } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────

/** How long to wait before declaring PDF generation hung (ms). */
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDebugInfo(data: SDSData, error: string | null, elapsedMs: number): string {
  const lines: string[] = [
    `⏱  Elapsed : ${(elapsedMs / 1000).toFixed(1)}s`,
    `🆔  CID     : ${data.cid}`,
    `🧪  Chemical: ${data.identity?.name ?? "(unknown)"}`,
    `📐  CAS     : ${data.identity?.cas ?? "n/a"}`,
    `🔤  Formula : ${data.identity?.formula ?? "n/a"}`,
    `🌍  Arabic  : ${data.arabicWarning ? `${data.arabicWarning.length} chars` : "none"}`,
    `🎨  Pictograms: ${data.ghs?.pictograms?.join(", ") || "none"}`,
    `📋  Sections with data:`,
  ];

  const sections: (keyof SDSData)[] = [
    "hazards", "firstAid", "fireFighting", "accidentalRelease",
    "handling", "storage", "exposure", "stability",
    "toxicology", "ecological", "disposal", "transport",
    "regulatory", "otherInfo",
  ];
  for (const key of sections) {
    const section = data[key] as { text?: string[] } | undefined;
    const count = section?.text?.length ?? 0;
    lines.push(`    • ${key}: ${count} items`);
  }

  if (error) lines.push(``, `❌  react-pdf error: ${error}`);

  return lines.join("\n");
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PDFExportButtonCore({
  data,
  fullWidth = false,
}: {
  data: SDSData;
  fullWidth?: boolean;
}) {
  const filename = `SDS_${data.identity.name.replace(/\s+/g, "_")}_${
    data.identity.cas || data.cid
  }.pdf`;

  const [instance, updateInstance] = usePDF({
    document: <SDSTemplate data={data} />,
  });

  const [timedOut, setTimedOut]   = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const timeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<number | null>(null);

  // ── Clear stale timeout + reset when underlying data changes ──────────────
  useEffect(() => {
    setTimedOut(false);
    setDebugInfo(null);
    updateInstance(<SDSTemplate data={data} />);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ── Timeout + error detection ─────────────────────────────────────────────
  useEffect(() => {
    if (instance.loading) {
      startedAtRef.current = Date.now();

      timeoutRef.current = setTimeout(() => {
        const elapsed = Date.now() - (startedAtRef.current ?? Date.now());
        const info = buildDebugInfo(data, instance.error, elapsed);
        console.error("[PDF] Generation timed out\n" + info);
        setDebugInfo(info);
        setTimedOut(true);
      }, TIMEOUT_MS);
    } else {
      // Finished (success or error)
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      startedAtRef.current = null;

      if (instance.error) {
        const elapsed = 0; // errored before timeout
        const info = buildDebugInfo(data, instance.error, elapsed);
        console.error("[PDF] Generation failed\n" + info);
        setDebugInfo(info);
        // Don't set timedOut — the "failed" label is more accurate
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance.loading, instance.error]);

  // ── Retry ─────────────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setTimedOut(false);
    setDebugInfo(null);
    updateInstance(<SDSTemplate data={data} />);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const isLoading  = instance.loading && !timedOut;
  const hasError   = timedOut || !!instance.error;

  // ── Error state ───────────────────────────────────────────────────────────
  if (hasError) {
    return (
      <div className={`flex flex-col gap-2 ${fullWidth ? "w-full" : ""}`}>
        <button
          onClick={handleRetry}
          className={`flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600
                      text-white text-sm font-semibold px-4 py-2 rounded-lg
                      active:scale-95 transition-all ${fullWidth ? "w-full" : ""}`}
        >
          <RefreshCw size={14} />
          {timedOut ? "PDF timed out · Retry" : "PDF failed · Retry"}
        </button>

        {debugInfo && (
          <details className="text-xs bg-red-50 border border-red-200 rounded-lg p-3 max-w-sm">
            <summary className="cursor-pointer font-semibold text-red-700 flex items-center gap-1">
              <AlertCircle size={12} />
              Debug info
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-all text-red-800 leading-relaxed">
              {debugInfo}
            </pre>
          </details>
        )}
      </div>
    );
  }

  // ── Normal state ──────────────────────────────────────────────────────────
  return (
    <a
      href={isLoading || !instance.url ? undefined : instance.url}
      download={filename}
      aria-disabled={isLoading}
      className={`flex items-center justify-center gap-2 bg-secondary hover:bg-accent-dark
                  text-white text-sm font-semibold px-4 py-2 rounded-lg
                  active:scale-95 transition-all duration-150
                  ${isLoading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
                  ${fullWidth ? "w-full" : ""}`}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Download size={14} />
      )}
      {isLoading ? "Building PDF…" : "Export SDS PDF"}
    </a>
  );
}
