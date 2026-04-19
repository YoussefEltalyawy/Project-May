"use client";

import { useState, useCallback, useEffect } from "react";
import { CompoundSearch } from "@/components/CompoundSearch";
import { SDSPreviewPanel } from "@/components/SDSPreviewPanel";
import { fetchFullSDSByCid, getCIDByName, SDSData } from "@/lib/pubchem";
import { FlaskConical, Beaker, Sparkles, FileText, Database, Search } from "lucide-react";

const LOADING_STEPS = [
  { label: "Searching compound database", icon: Database },
  { label: "Fetching safety data from PubChem", icon: FileText },
  { label: "Processing with AI", icon: Sparkles },
  { label: "Finalizing your sheet", icon: Beaker },
];

export default function Home() {
  const [data, setData] = useState<SDSData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Progress bar animation
  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setLoadingStep(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        const increment = Math.random() * 8 + 2;
        return Math.min(prev + increment, 95);
      });
    }, 200);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1500);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
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

      // 1. Check local storage cache (v3 includes Arabic RTL fixes)
      const cacheKey = `sds_cache_v3_${cid}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setData(JSON.parse(cached));
          setProgress(100);
          setTimeout(() => setIsLoading(false), 300);
          return;
        }
      } catch (err) {
        console.warn("Failed to read from localStorage:", err);
      }

      // 2. Fetch raw data from PubChem
      setLoadingStep(1);
      setProgress(45);
      const rawResult = await fetchFullSDSByCid(cid, term);
      if (!rawResult) {
        setError(`Could not load safety data for "${term}".`);
        setIsLoading(false);
        return;
      }

      // 3. Summarize using Gemini API Route
      setLoadingStep(2);
      setProgress(65);
      try {
        const summarizeRes = await fetch("/api/summarize-sds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rawResult),
        });

        if (summarizeRes.ok) {
          const summarizedResult = await summarizeRes.json();
          setLoadingStep(3);
          setProgress(90);
          setData(summarizedResult);
          
          // 4. Save summarized result to cache
          try {
            localStorage.setItem(cacheKey, JSON.stringify(summarizedResult));
          } catch (cacheSetErr) {
            console.warn("Could not write to localStorage (possibly quota exceeded):", cacheSetErr);
          }
        } else {
          const errorPayload = await summarizeRes.text();
          console.error("Gemini summarize API failed. Status:", summarizeRes.status, "Details:", errorPayload);
          console.error("Falling back to raw data...");
          setData(rawResult);
        }
      } catch (apiError) {
        console.error("Network error calling Gemini summarize API, falling back to raw data.", apiError);
        setData(rawResult);
      }

      setProgress(100);
      setTimeout(() => setIsLoading(false), 400);

    } catch {
      setError("A network error occurred. Please check your connection and try again.");
      setIsLoading(false);
    }
  }, []);

  const CurrentIcon = LOADING_STEPS[loadingStep]?.icon || Beaker;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <FlaskConical size={20} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-transparent">
                Project May
              </span>
              <p className="text-xs text-gray-500 -mt-0.5">Intelligent Safety Data Sheets</p>
            </div>
          </div>
          <a
            href="#"
            className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
          >
            About
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl" />
          <div className="absolute top-20 -left-20 w-60 h-60 bg-violet-100/50 rounded-full blur-3xl" />
        </div>

        <div className="relative px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-6">
            <Sparkles size={14} />
            <span>Powered by AI & PubChem</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-5">
            Find safety data.
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Instantly.
            </span>
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Search thousands of chemical compounds and generate beautiful,
            AI-enhanced Safety Data Sheets in seconds.
          </p>

          <div className="max-w-2xl mx-auto">
            <CompoundSearch onSelectTerm={handleSelectTerm} isLoading={isLoading} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-16">
        {/* Loading State with Progress Bar */}
        {isLoading && (
          <div className="animate-fade-up">
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
              {/* Progress Bar */}
              <div className="h-1.5 bg-gray-100 w-full">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="p-8 sm:p-12">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Animated Icon */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
                      <CurrentIcon
                        size={32}
                        className="text-indigo-600 animate-pulse"
                      />
                    </div>
                    {/* Pulsing ring */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-indigo-200 animate-ping opacity-30" />
                  </div>

                  {/* Text Content */}
                  <div className="text-center sm:text-left flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {LOADING_STEPS[loadingStep]?.label}
                    </h3>
                    <p className="text-gray-500 text-sm mb-3">
                      {Math.round(progress)}% complete
                    </p>

                    {/* Step indicators */}
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      {LOADING_STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isActive = idx === loadingStep;
                        const isDone = idx < loadingStep;
                        return (
                          <div
                            key={step.label}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                              isActive
                                ? "bg-indigo-100 text-indigo-700"
                                : isDone
                                ? "bg-green-50 text-green-600"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Icon size={12} />
                            <span className="hidden sm:inline">{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skeleton Preview */}
              <div className="px-8 pb-8">
                <div className="skeleton h-40 w-full rounded-xl" />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="animate-fade-up">
            <div className="bg-red-50/80 backdrop-blur border border-red-200 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <span className="text-xl text-red-600 font-bold">!</span>
              </div>
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Could not load data</h3>
                <p className="text-red-700/80 text-sm leading-relaxed">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Data Preview */}
        {data && !isLoading && (
          <div className="animate-fade-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Sparkles size={16} className="text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Ready for download
              </span>
            </div>
            <SDSPreviewPanel data={data} />
          </div>
        )}

        {/* Empty State */}
        {!data && !isLoading && !error && (
          <div className="animate-fade-up">
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-12 sm:p-16">
              <div className="grid sm:grid-cols-3 gap-8 text-center">
                {[
                  {
                    icon: Search,
                    title: "Search",
                    desc: "Type any chemical compound name",
                  },
                  {
                    icon: Sparkles,
                    title: "AI Enhancement",
                    desc: "We enrich data with intelligent processing",
                  },
                  {
                    icon: FileText,
                    title: "Export",
                    desc: "Download professional PDF sheets",
                  },
                ].map((item, idx) => (
                  <div key={item.title} className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center mb-4">
                      <item.icon size={24} className="text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 bg-white/50 backdrop-blur">
        <div className="px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FlaskConical size={16} className="text-indigo-600" />
              <span className="text-sm font-semibold text-gray-900">Project May</span>
            </div>
            <p className="text-xs text-gray-400">
              Data sourced from PubChem · PUG-View + LCSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
