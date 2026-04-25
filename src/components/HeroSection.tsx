import Image from "next/image";
import { CompoundSearch } from "@/components/CompoundSearch";

interface HeroSectionProps {
  onSelectTerm: (term: string) => void;
  isLoading: boolean;
  isCentered?: boolean;
}

export function HeroSection({ onSelectTerm, isLoading, isCentered = false }: HeroSectionProps) {
  return (
    <section className={`relative transition-all duration-700 ease-in-out flex flex-col ${isCentered ? "flex-1 justify-center pt-10 pb-0" : "pt-32 pb-10 sm:pt-36 sm:pb-12"}`}>
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <h1 className="text-[2.25rem] leading-[1.1] sm:text-6xl lg:text-7xl font-bold tracking-tight mb-5 sm:mb-6 animate-fade-up font-serif max-w-full md:whitespace-nowrap">
          <span className="text-brand-text block sm:inline">Standardized SDS.</span>{" "}
          <span className="text-brand-text italic block sm:inline">One Search Away.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-sm sm:text-lg md:text-xl text-brand-text-muted max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 animate-fade-up delay-2">
          Instant GHS compliance and ICSC-standardized sheets powered by
          real-time chemical informatics. Built for the modern laboratory.
        </p>

        {/* Search */}
        <div className="max-w-2xl mx-auto animate-fade-up delay-3">
          <CompoundSearch onSelectTerm={onSelectTerm} isLoading={isLoading} />
        </div>
      </div>

      {/* Teal globe — Pure CSS for mobile only (< sm) */}
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-1/2 -translate-x-1/2 translate-y-[60%] w-[1200px] h-[1200px] sm:hidden z-0"
      >
        <div className="absolute inset-0 rounded-full bg-accent/[0.05] blur-[80px]" />
        <div className="absolute inset-[20%] rounded-full bg-accent/[0.08] blur-[80px]" />
      </div>

      {/* Teal globe — Image for desktop only (sm and up) */}
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-1/2 -translate-x-1/2 flex justify-center translate-y-[35%] hidden sm:flex min-w-[1600px] w-[180vw] max-w-[2800px] z-0"
      >
        <Image
          src="/hero-glob.webp"
          alt="Glowing teal background texture"
          width={2400}
          height={1200}
          className="w-full h-auto object-cover opacity-100"
          priority
          unoptimized
        />
      </div>
    </section>
  );
}
