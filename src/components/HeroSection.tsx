import { CompoundSearch } from "@/components/CompoundSearch";

interface HeroSectionProps {
  onSelectTerm: (term: string) => void;
  isLoading: boolean;
}

export function HeroSection({ onSelectTerm, isLoading }: HeroSectionProps) {
  return (
    <section className="relative pt-36 pb-16 sm:pt-44 sm:pb-20">
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-up whitespace-nowrap font-serif">
          <span className="text-brand-text">Standardized SDS.</span>{" "}
          <span className="text-brand-text italic">One Search Away.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-brand-text-muted max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-up delay-2">
          Instant GHS compliance and ICSC-standardized sheets powered by
          real-time chemical informatics. Built for the modern laboratory.
        </p>

        {/* Search */}
        <div className="max-w-2xl mx-auto animate-fade-up delay-3">
          <CompoundSearch onSelectTerm={onSelectTerm} isLoading={isLoading} />
        </div>
      </div>

      {/* Teal globe — wide, soft, circular, positioned at the very bottom of the viewport area */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[60%] w-[900px] h-[900px]"
      >
        <div className="absolute inset-0 rounded-full bg-accent/[0.04] blur-3xl" />
        <div className="absolute inset-[20%] rounded-full bg-accent/[0.06] blur-3xl" />
      </div>
    </section>
  );
}
