import Image from "next/image";

const GITHUB_URL = "https://github.com/YoussefEltalyawy/Project-May";

function GithubIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function SiteNav() {
  return (
    <nav className="fixed top-4 md:top-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 md:gap-5 px-4 py-2 md:px-6 md:py-3 rounded-full border border-accent bg-white/85 backdrop-blur-md shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <Image
            src="/project-may-logo.png"
            alt="Project May logo"
            width={24}
            height={24}
            className="w-5 h-5 md:w-7 md:h-7 object-contain"
          />
          <span className="text-xs md:text-base font-semibold text-brand-text whitespace-nowrap">Project May</span>
        </div>

        {/* Vertical divider */}
        <span className="w-px h-4 md:h-5 bg-gray-300" aria-hidden />

        {/* GitHub link */}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm md:text-[15px] font-medium text-brand-text hover:text-accent transition-colors"
        >
          <GithubIcon size={16} className="md:w-5 md:h-5" />
          <span className="text-xs md:text-base whitespace-nowrap">Github</span>
        </a>
      </div>
    </nav>
  );
}
