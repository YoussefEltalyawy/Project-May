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

  return (
    <div className="animate-scale-in max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-brand-border shadow-xl shadow-gray-200/50 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-accent via-teal-400 to-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5 sm:p-8 md:p-10">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Animated icon */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-accent-light flex items-center justify-center">
                <CurrentIcon size={22} className="text-accent sm:w-6 sm:h-6 md:w-7 md:h-7" />
              </div>
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl ring-2 ring-secondary/30 animate-pulse-ring" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-brand-text mb-1">
                {LOADING_STEPS[loadingStep]?.label}
              </h3>
              <p className="text-xs sm:text-sm text-brand-text-muted mb-3 sm:mb-4">
                {Math.round(progress)}% complete
              </p>

              {/* Step indicators */}
              <div className="flex items-center gap-2">
                {LOADING_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = idx === loadingStep;
                  const isDone   = idx < loadingStep;
                  return (
                    <div
                      key={step.label}
                      className={[
                        "flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium transition-all duration-300",
                        isActive ? "bg-accent-light text-accent-dark"
                          : isDone  ? "bg-secondary/10 text-secondary"
                          : "bg-gray-100 text-gray-400",
                      ].join(" ")}
                    >
                      <Icon size={10} className="sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton */}
        <div className="px-5 sm:px-8 pb-5 sm:pb-8">
          <div className="skeleton h-24 sm:h-32 w-full rounded-lg sm:rounded-xl" />
        </div>
      </div>
    </div>
  );
}
