"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { fetchFullSDSByCid, getCIDByName, SDSData } from "@/lib/pubchem";
import { getCachedSDS, setCachedSDS, addSearchHistory } from "@/lib/cache";
import { SiteNav } from "@/components/SiteNav";
import { HeroSection } from "@/components/HeroSection";
import { LoadingState, LOADING_STEPS } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { ResultsSection } from "@/components/ResultsSection";

// ─── Data fetching logic ─────────────────────────────────────────────────────

async function summarizeSDS(rawResult: SDSData): Promise<SDSData> {
  const res = await fetch("/api/summarize-sds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rawResult),
  });
  if (!res.ok) throw new Error("Summarize API failed");
  return res.json();
}

// ─── Page component ──────────────────────────────────────────────────────────

export default function Home() {
  const [data, setData]               = useState<SDSData | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress]       = useState(0);
  const [error, setError]             = useState<string | null>(null);
  const mainRef                        = useRef<HTMLDivElement>(null);

  // Scroll to results when data loads
  useEffect(() => {
    if (data && !isLoading && mainRef.current) {
      setTimeout(() => mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [data, isLoading]);

  // Reset progress after loading stops
  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => { setProgress(0); setLoadingStep(0); }, 500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Animate progress bar while loading
  useEffect(() => {
    if (!isLoading) return;
    const progressInterval = setInterval(() => {
      setProgress((p) => (p >= 95 ? p : Math.min(p + Math.random() * 6 + 1, 95)));
    }, 250);
    const stepInterval = setInterval(() => {
      setLoadingStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
    }, 1200);
    return () => { clearInterval(progressInterval); clearInterval(stepInterval); };
  }, [isLoading]);

  const handleSelectTerm = useCallback(async (term: string) => {
    setIsLoading(true);
    setProgress(5);
    setLoadingStep(0);
    setError(null);
    setData(null);

    try {
      const cid = await getCIDByName(term);
      if (!cid) {
        setError(`No compound found for "${term}". Try another spelling or pick a suggestion.`);
        setIsLoading(false);
        return;
      }

      setLoadingStep(1);
      setProgress(30);

      // Cache hit?
      try {
        const cached = await getCachedSDS(cid);
        if (cached) {
          setData(cached);
          setProgress(100);
          setTimeout(() => setIsLoading(false), 300);
          await addSearchHistory({ term, cid, name: cached.identity.name || term, cas: cached.identity.cas, formula: cached.identity.formula });
          return;
        }
      } catch (e) {
        console.warn("Cache read failed:", e);
      }

      // Fetch from PubChem
      setProgress(45);
      const rawResult = await fetchFullSDSByCid(cid, term);
      if (!rawResult) {
        setError(`Could not load safety data for "${term}".`);
        setIsLoading(false);
        return;
      }

      // AI summarization
      setLoadingStep(2);
      setProgress(65);
      let finalResult = rawResult;
      try {
        finalResult = await summarizeSDS(rawResult);
      } catch (e) {
        console.error("Gemini API error, using raw data:", e);
      }

      setLoadingStep(3);
      setProgress(90);
      setData(finalResult);

      try {
        await setCachedSDS(cid, finalResult);
        await addSearchHistory({ term, cid, name: finalResult.identity.name || term, cas: finalResult.identity.cas, formula: finalResult.identity.formula });
      } catch (e) {
        console.warn("Cache write failed:", e);
      }

      setProgress(100);
      setTimeout(() => setIsLoading(false), 400);
    } catch {
      setError("A network error occurred. Please check your connection and try again.");
      setIsLoading(false);
    }
  }, []);

  const hasContent = isLoading || (!!error && !isLoading) || (!!data && !isLoading);

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg">
      <SiteNav />

      <HeroSection onSelectTerm={handleSelectTerm} isLoading={isLoading} isCentered={!hasContent} />

      {hasContent && (
        <main ref={mainRef} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {isLoading && (
            <LoadingState progress={progress} loadingStep={loadingStep} />
          )}

          {error && !isLoading && (
            <ErrorState message={error} onDismiss={() => setError(null)} />
          )}

          {data && !isLoading && (
            <ResultsSection data={data} onClear={() => { setData(null); setError(null); }} />
          )}
        </main>
      )}

      <footer className="mt-auto border-t border-brand-border bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/project-may-logo.png" alt="Project May" className="w-5 h-5 object-contain" />
            <span className="text-sm font-medium text-brand-text">Project May</span>
          </div>
          <p className="text-xs text-brand-text-muted">Data from PubChem · Powered by Gemini AI</p>
        </div>
      </footer>
    </div>
  );
}
