import { Beaker, Sparkles, FileText, Database } from "lucide-react";

export const LOADING_STEPS = [
  { label: "Searching database",  icon: Database  },
  { label: "Fetching safety data", icon: FileText  },
  { label: "AI enhancement",       icon: Sparkles  },
  { label: "Finalizing",           icon: Beaker    },
] as const;

interface LoadingStateProps {
  progress: number;
  loadingStep: number;
}

export function LoadingState({ progress, loadingStep }: LoadingStateProps) {
  const CurrentIcon = LOADING_STEPS[loadingStep]?.icon ?? Beaker;
  const currentStepIndex = loadingStep + 1;
  const totalSteps = LOADING_STEPS.length;

  return (
    <div className="animate-fade-up max-w-2xl mx-auto w-full">
      <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm overflow-hidden flex flex-col transition-all duration-300">
        {/* Sleek Progress Bar */}
        <div className="h-1 bg-gray-100 w-full relative overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8 md:p-10 flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex flex-row items-center gap-5">
              {/* Premium Icon Container */}
              <div className="w-14 h-14 rounded-2xl bg-accent/[0.04] border border-accent/10 flex items-center justify-center shrink-0 shadow-sm">
                <CurrentIcon size={24} className="text-accent" strokeWidth={1.75} />
              </div>
              
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-brand-text tracking-tight mb-1">
                  {LOADING_STEPS[loadingStep]?.label}
                </h3>
                <div className="text-sm text-brand-text-muted">
                  Preparing standardized results...
                </div>
              </div>
            </div>

            {/* Step out of step badge */}
            <div className="shrink-0 flex items-center h-8 px-3.5 bg-accent/[0.04] border border-accent/10 rounded-full shadow-sm text-accent">
                <span className="text-xs font-semibold tracking-wider uppercase">
                  Step {currentStepIndex} of {totalSteps}
                </span>
            </div>
          </div>

          {/* Restrained elegant skeleton lines */}
          <div className="space-y-4 pt-2">
            <div className="skeleton h-3 w-3/4 rounded-full bg-gray-100" />
            <div className="skeleton h-3 w-full rounded-full bg-gray-100" />
            <div className="skeleton h-3 w-5/6 rounded-full bg-gray-100" />
            <div className="skeleton h-3 w-1/2 rounded-full bg-gray-100" />
          </div>
        </div>
      </div>
      
      {/* Optional progress indicator text */}
      <div className="mt-4 text-center">
        <span className="text-sm flex items-center justify-center gap-2 font-medium text-brand-text-muted">
          <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
          {Math.round(progress)}% Complete
        </span>
      </div>
    </div>
  );
}
