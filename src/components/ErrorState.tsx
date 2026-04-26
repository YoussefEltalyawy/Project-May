import { AlertCircle, X } from "lucide-react";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { animateEntrance } from "@/lib/animation-utils";

interface ErrorStateProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorState({ message, onDismiss }: ErrorStateProps) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    animateEntrance(container.current, { stagger: 0 });
  }, { scope: container });

  return (
    <div ref={container} className="max-w-3xl mx-auto opacity-0">
      <div className="bg-red-50/90 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
          <AlertCircle size={20} className="text-red-600" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">Unable to load data</h3>
          <p className="text-red-700/80 text-sm leading-relaxed">{message}</p>
        </div>

        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
