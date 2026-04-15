"use client";

import { useState, useCallback } from "react";
import { CompoundSearch } from "@/components/CompoundSearch";
import { SDSPreviewPanel } from "@/components/SDSPreviewPanel";
import { fetchFullSDSByCid, getCIDByName, SDSData } from "@/lib/pubchem";
import { FlaskConical } from "lucide-react";

export default function Home() {
  const [data, setData] = useState<SDSData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTerm = useCallback(async (term: string) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const cid = await getCIDByName(term);
      if (!cid) {
        setError(`No compound found for "${term}". Try another spelling or pick a suggestion.`);
        return;
      }
      const result = await fetchFullSDSByCid(cid, term);
      if (result) {
        setData(result);
      } else {
        setError(`Could not load safety data for "${term}".`);
      }
    } catch {
      setError("A network error occurred. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col items-center text-center gap-4">
          <div className="flex items-center gap-2 text-gray-700 mb-1">
            <FlaskConical size={20} />
            <span className="text-sm font-semibold tracking-wide uppercase">Project May</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-none">
            Safety Data Sheet
          </h1>

          <p className="text-gray-500 text-base max-w-lg leading-relaxed">
            Search PubChem, open a compound, then preview and export the same PDF layout.
          </p>

          <div className="w-full mt-3">
            <CompoundSearch onSelectTerm={handleSelectTerm} isLoading={isLoading} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {isLoading && (
          <div className="space-y-4">
            <div className="skeleton h-28 w-full" />
            <div className="skeleton w-full h-[min(85vh,56rem)] min-h-[28rem] max-h-[calc(100dvh-10rem)]" />
          </div>
        )}

        {error && !isLoading && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            <span className="text-xl mt-0.5" aria-hidden>!</span>
            <div>
              <p className="font-semibold text-sm">Could not load</p>
              <p className="text-sm text-red-700/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {data && !isLoading && (
          <div className="animate-fade-up">
            <SDSPreviewPanel data={data} />
          </div>
        )}

        {!data && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-28 gap-3 text-gray-300 select-none">
            <FlaskConical size={52} strokeWidth={1} />
            <p className="text-sm">Choose a compound to see the PDF preview</p>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white mt-10">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>Project May · SDS summary from PubChem</span>
          <span>PUG-View + LCSS where available</span>
        </div>
      </footer>
    </div>
  );
}
