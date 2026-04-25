import { SDSPreviewPanel } from "@/components/SDSPreviewPanel";
import type { SDSData } from "@/lib/pubchem";

interface ResultsSectionProps {
  data: SDSData;
  onClear: () => void;
}

export function ResultsSection({ data, onClear }: ResultsSectionProps) {
  return (
    <div className="animate-scale-in">
      <SDSPreviewPanel data={data} onClear={onClear} />
    </div>
  );
}
