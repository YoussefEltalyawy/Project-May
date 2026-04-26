import { SDSPreviewPanel } from "@/components/SDSPreviewPanel";
import type { SDSData } from "@/lib/pubchem";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { animateEntrance } from "@/lib/animation-utils";

interface ResultsSectionProps {
  data: SDSData;
  onClear: () => void;
}

export function ResultsSection({ data, onClear }: ResultsSectionProps) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    animateEntrance(container.current, { stagger: 0.15, useScrollTrigger: true, trigger: container.current });
  }, { scope: container });

  return (
    <div ref={container} className="opacity-0">
      <SDSPreviewPanel data={data} onClear={onClear} />
    </div>
  );
}
