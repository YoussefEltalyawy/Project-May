"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { CompoundSearch } from "@/components/CompoundSearch";
import { SDSPreviewPanel } from "@/components/SDSPreviewPanel";
import { fetchFullSDSByCid, getCIDByName, SDSData } from "@/lib/pubchem";
import { getCachedSDS, setCachedSDS, addSearchHistory } from "@/lib/cache";
import { 
  FlaskConical, 
  Beaker, 
  Sparkles, 
  FileText, 
  Database, 
  Search, 
  AlertCircle,
  Download,
  Zap,
  Shield
} from "lucide-react";

const LOADING_STEPS = [
  { label: "Searching database", icon: Database },
  { label: "Fetching safety data", icon: FileText },
  { label: "AI enhancement", icon: Sparkles },
  { label: "Finalizing", icon: Beaker },
];

const FEATURES = [
  {
    icon: Search,
    title: "Smart Search",
    desc: "Instantly find any chemical compound with intelligent autocomplete",
  },
  {
    icon: Zap,
    title: "AI Powered",
    desc: "Gemini AI enriches raw data into professional safety documentation",
  },
  {
    icon: Download,
    title: "PDF Export",
    desc: "Download beautifully formatted, industry-standard SDS sheets",
  },
];

export default function Home() {
  const [data, setData] = useState<SDSData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Scroll to results when data loads
  useEffect(() => {
    if (data && !isLoading && mainRef.current) {
      setTimeout(() => {
        mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [data, isLoading]);

  // Reset progress when loading starts/stops
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setProgress(0);
        setLoadingStep(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Progress bar animation
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        const increment = Math.random() * 6 + 1;
        return Math.min(prev + increment, 95);
      });
    }, 250);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

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

      // Check IndexedDB cache
      try {
        const cached = await getCachedSDS(cid);
        if (cached) {
          setData(cached);
          setProgress(100);
          setTimeout(() => setIsLoading(false), 300);
          await addSearchHistory({
            term,
            cid,
            name: cached.identity.name || term,
            cas: cached.identity.cas,
            formula: cached.identity.formula,
          });
          return;
        }
      } catch (err) {
        console.warn("Failed to read from cache:", err);
      }

      // Fetch raw data from PubChem
      setLoadingStep(1);
      setProgress(45);
      const rawResult = await fetchFullSDSByCid(cid, term);
      if (!rawResult) {
        setError(`Could not load safety data for "${term}".`);
        setIsLoading(false);
        return;
      }

      // Summarize using Gemini API
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
          
          try {
            await setCachedSDS(cid, summarizedResult);
            await addSearchHistory({
              term,
              cid,
              name: summarizedResult.identity.name || term,
              cas: summarizedResult.identity.cas,
              formula: summarizedResult.identity.formula,
            });
          } catch (cacheSetErr) {
            console.warn("Could not write to cache:", cacheSetErr);
          }
        } else {
          setData(rawResult);
        }
      } catch (apiError) {
        console.error("Gemini API error, using raw data:", apiError);
        setData(rawResult);
      }

      setProgress(100);
      setTimeout(() => setIsLoading(false), 400);

    } catch {
      setError("A network error occurred. Please check your connection and try again.");
      setIsLoading(false);
    }
  }, []);

  const handleDismissError = () => setError(null);
  const handleClearResults = () => {
    setData(null);
    setError(null);
  };

  const CurrentIcon = LOADING_STEPS[loadingStep]?.icon || Beaker;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <FlaskConical size={18} className="text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Project May</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://pubchem.ncbi.nlm.nih.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Database size={14} />
                <span>PubChem</span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-20 pt-32 pb-16 sm:pt-40 sm:pb-20">
        {/* Background gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-100/60 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-100/50 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-amber-50/50 to-transparent rounded-full" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-gray-200/80 shadow-sm mb-8 animate-fade-down">
            <Sparkles size={14} className="text-amber-500" />
            <span className="text-sm font-medium text-gray-700">AI-Enhanced Safety Data Sheets</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 animate-fade-up" style={{ animationDelay: "0.05s" }}>
            Find chemical safety data.
            <span className="block gradient-text mt-1">Instantly.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Search thousands of compounds and generate professional Safety Data Sheets 
            powered by PubChem and Gemini AI.
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <CompoundSearch onSelectTerm={handleSelectTerm} isLoading={isLoading} />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main ref={mainRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Loading State */}
        {isLoading && (
          <div className="animate-scale-in max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-xl shadow-gray-200/50 overflow-hidden">
              {/* Progress bar */}
              <div className="h-1 bg-gray-100">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="p-8 sm:p-10">
                <div className="flex items-center gap-6">
                  {/* Animated icon */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                      <CurrentIcon size={28} className="text-amber-600" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-amber-500/30 animate-pulse-ring" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {LOADING_STEPS[loadingStep]?.label}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {Math.round(progress)}% complete
                    </p>

                    {/* Step indicators */}
                    <div className="flex items-center gap-2">
                      {LOADING_STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isActive = idx === loadingStep;
                        const isDone = idx < loadingStep;
                        return (
                          <div
                            key={step.label}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                              isActive
                                ? "bg-amber-100 text-amber-700"
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

              {/* Skeleton content */}
              <div className="px-8 pb-8">
                <div className="skeleton h-32 w-full rounded-xl" />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="animate-scale-in max-w-3xl mx-auto">
            <div className="bg-red-50/90 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Unable to load data</h3>
                <p className="text-red-700/80 text-sm leading-relaxed">{error}</p>
              </div>
              <button
                onClick={handleDismissError}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {data && !isLoading && (
          <div className="animate-scale-in">
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
                  <Shield size={20} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Safety Data Sheet Ready</h2>
                  <p className="text-sm text-gray-500">{data.identity.name}</p>
                </div>
              </div>
              <button
                onClick={handleClearResults}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Clear results
              </button>
            </div>

            <SDSPreviewPanel data={data} />
          </div>
        )}

        {/* Empty State / Features */}
        {!data && !isLoading && !error && (
          <div className="animate-fade-up">
            <div className="grid sm:grid-cols-3 gap-6">
              {FEATURES.map((feature, idx) => (
                <div
                  key={feature.title}
                  className="group bg-white rounded-2xl border border-gray-200/60 p-6 card-hover"
                  style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon size={22} className="text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Stats / trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">100M+</div>
                <div className="text-sm text-gray-500">Compounds</div>
              </div>
              <div className="w-px h-8 bg-gray-200 hidden sm:block" />
              <div>
                <div className="text-2xl font-bold text-gray-900">Instant</div>
                <div className="text-sm text-gray-500">PDF Generation</div>
              </div>
              <div className="w-px h-8 bg-gray-200 hidden sm:block" />
              <div>
                <div className="text-2xl font-bold text-gray-900">AI</div>
                <div className="text-sm text-gray-500">Enhanced Data</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FlaskConical size={16} className="text-amber-500" />
              <span className="text-sm font-medium text-gray-700">Project May</span>
            </div>
            <p className="text-xs text-gray-400">
              Data from PubChem · Powered by Gemini AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
