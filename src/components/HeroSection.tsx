import Image from "next/image";
import { CompoundSearch } from "@/components/CompoundSearch";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { animateEntrance } from "@/lib/animation-utils";

interface HeroSectionProps {
  onSelectTerm: (term: string) => void;
  isLoading: boolean;
  isCentered?: boolean;
}

export function HeroSection({ onSelectTerm, isLoading, isCentered = false }: HeroSectionProps) {
  const container = useRef<HTMLElement>(null);

  useGSAP(() => {
    animateEntrance(".gsap-hero-item", { stagger: 0.08, delay: 0.2 });
    animateEntrance(".gsap-globe", { delay: 0.5 });
  }, { scope: container });

  return (
    <section ref={container} className={`relative transition-all duration-700 ease-in-out flex flex-col overflow-x-hidden ${isCentered ? "flex-1 justify-center pb-0" : "pt-30 pb-10 sm:pt-36 sm:pb-12"}`}>
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <h1 className="gsap-hero-item text-[2.25rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5 sm:mb-6 font-serif opacity-0 border-b-0">
          <span className="text-brand-text block sm:inline">Standardized SDS.</span>{" "}
          <span className="text-brand-text italic block sm:inline">One Search Away.</span>
        </h1>

        {/* Subheadline */}
        <p className="gsap-hero-item text-sm sm:text-lg md:text-xl text-brand-text-muted max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 opacity-0">
          Instant GHS compliance and ICSC-standardized sheets powered by
          real-time chemical informatics.
        </p>

        {/* Search */}
        <div className="gsap-hero-item max-w-2xl mx-auto opacity-0">
          <CompoundSearch onSelectTerm={onSelectTerm} isLoading={isLoading} />
        </div>
      </div>

      {/* Teal globe — Pure CSS for mobile only (< sm) */}
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-1/2 -translate-x-1/2 translate-y-[60%] w-[1200px] h-[1200px] sm:hidden z-0"
      >
        <div className="gsap-globe w-full h-full opacity-0 relative">
          <div className="absolute inset-0 rounded-full bg-accent/[0.05] blur-[80px]" />
          <div className="absolute inset-[20%] rounded-full bg-accent/[0.08] blur-[80px]" />
        </div>
      </div>

      {/* Teal globe — Image for desktop only (sm and up) */}
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-1/2 -translate-x-1/2 flex justify-center translate-y-[35%] hidden sm:flex w-[180vw] md:w-[160vw] lg:w-[140vw] max-w-[2800px] z-0"
      >
        <div className="gsap-globe opacity-0 w-full flex justify-center">
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
      </div>
    </section>
  );
}
