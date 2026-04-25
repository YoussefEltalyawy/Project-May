import { SDSData, PhysicalProperties } from "@/lib/pubchem";
import { useState } from "react";
import {
  Beaker, AlertTriangle, Heart, Flame, Hand, Package, Shield,
  Leaf, Trash2, Microscope, AlertCircle, Maximize2, Minimize2, ArrowLeft,
} from "lucide-react";

// ─── Section definitions ─────────────────────────────────────────────────────

const TEXT_SECTIONS: Array<{
  key: keyof Omit<SDSData, "cid" | "identity" | "ghs" | "physical">;
  label: string;
  num: string;
  icon: React.ElementType;
}> = [
  { num: "3", key: "hazards",      label: "Hazards Identification",                icon: AlertTriangle },
  { num: "4", key: "firstAid",     label: "First Aid Measure",                     icon: Heart },
  { num: "5", key: "fireFighting", label: "Firefight Measure",                     icon: Flame },
  { num: "6", key: "handling",     label: "Handling",                              icon: Hand },
  { num: "6", key: "storage",      label: "Storage",                               icon: Package },
  { num: "7", key: "exposure",     label: "Exposure Controls / Personal Protection", icon: Shield },
  { num: "8", key: "ecological",   label: "Ecological Information",                icon: Leaf },
  { num: "9", key: "disposal",     label: "Disposal Considerations",               icon: Trash2 },
  { num: "10", key: "toxicology",  label: "Toxicological Info",                    icon: Microscope },
];

const ARABIC_SECTION = { key: "arabicWarning", label: "Arabic Safety Warning" };

const PHYSICAL_PROPS: Array<{ key: keyof PhysicalProperties; label: string; placeholder: string }> = [
  { key: "appearance",    label: "Appearance",         placeholder: "e.g. Colorless liquid" },
  { key: "odor",          label: "Odor",               placeholder: "e.g. Pungent odor" },
  { key: "boilingPoint",  label: "Boiling Point",      placeholder: "e.g. 100°C" },
  { key: "meltingPoint",  label: "Melting Point",      placeholder: "e.g. 0°C" },
  { key: "flashPoint",    label: "Flash Point",        placeholder: "e.g. 15°C" },
  { key: "density",       label: "Density",            placeholder: "e.g. 1.0 g/cm³" },
  { key: "vaporPressure", label: "Vapor Pressure",     placeholder: "e.g. 23 mmHg at 25°C" },
  { key: "solubility",    label: "Solubility",         placeholder: "e.g. Miscible in water" },
  { key: "ph",            label: "pH",                 placeholder: "e.g. 7.0" },
  { key: "autoIgnition",  label: "Auto-ignition Temp.", placeholder: "e.g. 400°C" },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface SDSEditorProps {
  data: SDSData;
  onChange: (data: SDSData) => void;
}

export const SDSEditor = ({ data, onChange }: SDSEditorProps) => {
  const [focusedSection, setFocusedSection] = useState<string | null>(null);

  const handleTextChange = (
    key: keyof Omit<SDSData, "cid" | "identity" | "ghs" | "physical">,
    value: string
  ) => {
    const lines = value
      .split(/\n\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    onChange({ ...data, [key]: { text: lines } });
  };

  const handlePhysicalChange = (key: keyof PhysicalProperties, value: string) => {
    onChange({ ...data, physical: { ...data.physical, [key]: value } });
  };

  const toggleFocus = (id: string) =>
    setFocusedSection((prev) => (prev === id ? null : id));

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pr-2 pb-10 scroll-smooth custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-brand-text-muted uppercase tracking-widest">
          {focusedSection ? "Focus Mode" : "All Sections"}
        </h3>
        {focusedSection && (
          <button
            onClick={() => setFocusedSection(null)}
            className="flex items-center gap-1.5 px-3 py-1 bg-accent text-white rounded-full text-[10px] font-bold shadow-sm hover:bg-accent-dark transition-all"
          >
            <ArrowLeft size={12} />
            Show All Sections
          </button>
        )}
      </div>

      {/* ── Section navigator ── */}
      {!focusedSection && (
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 py-3 mb-2 flex flex-wrap gap-2">
          <NavPill
            label="SETUP"
            onClick={() => document.getElementById("section-meta")?.scrollIntoView({ behavior: "smooth" })}
          />
          <NavPill
            label="S2. PHYSICAL"
            variant="accent"
            onClick={() => document.getElementById("section-2")?.scrollIntoView({ behavior: "smooth" })}
          />
          {TEXT_SECTIONS.map(({ num, label, key }) => (
            <NavPill
              key={String(key)}
              label={`S${num}. ${label.split(" ")[0].toUpperCase()}`}
              onClick={() => document.getElementById(`section-${String(key)}`)?.scrollIntoView({ behavior: "smooth" })}
            />
          ))}
          <NavPill
            label="ARABIC"
            variant="secondary"
            onClick={() => document.getElementById("section-arabic")?.scrollIntoView({ behavior: "smooth" })}
          />
        </div>
      )}

      {/* ── 1. General Setup ── */}
      {(!focusedSection || focusedSection === "meta") && (
        <SectionCard
          id="section-meta"
          focused={focusedSection === "meta"}
          onToggleFocus={() => toggleFocus("meta")}
        >
          <SectionCardHeader accentBar>
            <span className="block text-sm font-bold text-brand-text">General Setup</span>
          </SectionCardHeader>
          <div className="flex flex-col gap-2 mt-4">
            <label htmlFor="preparedBy" className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider block">
              Document Attribution
            </label>
            <input
              id="preparedBy"
              type="text"
              value={data.preparedBy || ""}
              onChange={(e) => onChange({ ...data, preparedBy: e.target.value })}
              placeholder="e.g. Chemist Maysa Ahmed"
              className="editor-input w-full block"
            />
            {!data.preparedBy && (
              <p className="text-[10px] text-accent flex items-center gap-1.5 font-medium">
                <AlertCircle size={10} />
                Hiding attribution line from PDF
              </p>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── 2. Physical & Chemical Properties ── */}
      {(!focusedSection || focusedSection === "2") && (
        <SectionCard
          id="section-2"
          focused={focusedSection === "2"}
          onToggleFocus={() => toggleFocus("2")}
          className="bg-accent/[0.02]"
        >
          <SectionCardHeader
            icon={Beaker}
            iconClassName="bg-accent text-white shadow-sm"
          >
            <h4 className="font-bold text-brand-text text-sm">Section 2</h4>
            <p className="text-[11px] text-accent font-bold uppercase tracking-tight">
              Physical & Chemical Properties
            </p>
          </SectionCardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {PHYSICAL_PROPS.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label
                  htmlFor={`phys-${key}`}
                  className="block text-[11px] font-bold text-brand-text-muted uppercase tracking-wide"
                >
                  {label}
                </label>
                <input
                  id={`phys-${key}`}
                  type="text"
                  value={data.physical[key] || ""}
                  onChange={(e) => handlePhysicalChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="editor-input"
                />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── 3-10. Text Sections ── */}
      {TEXT_SECTIONS.map(({ num, key, label, icon: Icon }) => {
        const textArray =
          ((data as unknown) as Record<string, { text?: string[] }>)[String(key)]?.text || [];
        const value = textArray.join("\n\n");
        const isFocused = focusedSection === String(key);

        if (focusedSection && !isFocused) return null;

        return (
          <SectionCard
            key={String(key)}
            id={`section-${String(key)}`}
            focused={isFocused}
            onToggleFocus={() => toggleFocus(String(key))}
          >
            <SectionCardHeader
              icon={Icon}
              iconClassName={
                isFocused
                  ? "bg-accent text-white shadow-sm"
                  : "bg-gray-100 text-brand-text-muted group-hover:bg-accent group-hover:text-white"
              }
            >
              <h4 className="font-bold text-brand-text text-sm">Section {num}</h4>
              <label
                htmlFor={`editor-${String(key)}`}
                className={[
                  "text-[11px] font-bold uppercase tracking-tight transition-colors",
                  isFocused ? "text-accent" : "text-brand-text-muted group-hover:text-accent",
                ].join(" ")}
              >
                {label}
              </label>
            </SectionCardHeader>
            <textarea
              id={`editor-${String(key)}`}
              value={value}
              onChange={(e) => handleTextChange(key, e.target.value)}
              placeholder={`Enter details for ${label.toLowerCase()}…`}
              className={`editor-textarea block w-full mt-3 ${isFocused ? "min-h-[450px]" : "min-h-[140px]"}`}
            />
            <div className="mt-2 flex justify-between items-center text-[10px] text-gray-400 font-medium px-1">
              <span>Supports multiline text</span>
              <span className="uppercase">{String(key).toUpperCase()}</span>
            </div>
          </SectionCard>
        );
      })}

      {/* ── Arabic Warning ── */}
      {(!focusedSection || focusedSection === "arabic") && (
        <SectionCard
          id="section-arabic"
          focused={focusedSection === "arabic"}
          onToggleFocus={() => toggleFocus("arabic")}
          className="bg-secondary/[0.03]"
        >
          <div className="flex items-center justify-between mb-4">
            <SectionCardHeader
              icon={AlertCircle}
              iconClassName={
                focusedSection === "arabic"
                  ? "bg-secondary text-white shadow-sm"
                  : "bg-secondary/10 text-secondary"
              }
            >
              <h4 className="font-bold text-brand-text text-sm">Action Level Warning</h4>
              <p className="text-[11px] text-secondary font-bold uppercase tracking-tight">
                {ARABIC_SECTION.label}
              </p>
            </SectionCardHeader>
            <span className="text-[10px] px-2.5 py-1 bg-secondary text-white font-bold rounded-full shadow-sm">
              RTL
            </span>
          </div>
          <textarea
            id="editor-arabic"
            value={data.arabicWarning || ""}
            onChange={(e) => onChange({ ...data, arabicWarning: e.target.value })}
            dir="rtl"
            placeholder="تحذير السلامة بالعربية..."
            className={`editor-textarea block w-full text-lg font-bold ${
              focusedSection === "arabic" ? "min-h-[450px]" : "min-h-[160px]"
            }`}
            style={{ fontFamily: "Cairo, sans-serif" }}
            spellCheck={false}
          />
        </SectionCard>
      )}
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Section wrapper card. */
function SectionCard({
  id,
  focused,
  onToggleFocus,
  className = "",
  children,
}: {
  id: string;
  focused: boolean;
  onToggleFocus: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className={[
        "scroll-mt-16 relative rounded-2xl border-2 p-5 transition-all group",
        focused
          ? "border-accent shadow-lg"
          : "border-gray-100 shadow-sm hover:border-accent/20",
        className,
      ].join(" ")}
    >
      {children}
      {/* Focus toggle is placed per SectionCardHeader, but we need onToggleFocus available */}
      {/* Using a hidden button so the toggle can be accessed from SectionCardHeader children isn't ideal, */}
      {/* so we add a small floating button */}
      <button
        onClick={onToggleFocus}
        className={[
          "absolute top-4 right-4 p-2 rounded-lg transition-all border",
          focused
            ? "bg-accent/5 text-accent border-accent/20"
            : "text-gray-400 hover:text-accent hover:bg-accent/5 border-transparent",
        ].join(" ")}
        title={focused ? "Exit focus" : "Focus this section"}
        style={{ position: "absolute" }}
      >
        {focused ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  );
}

/** Section card header content (icon + titles). */
function SectionCardHeader({
  icon: Icon,
  iconClassName,
  accentBar,
  children,
}: {
  icon?: React.ElementType;
  iconClassName?: string;
  accentBar?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {accentBar && <span className="w-1.5 h-5 bg-accent rounded-full" />}
      {Icon && (
        <div
          className={[
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
            iconClassName || "bg-gray-100 text-brand-text-muted",
          ].join(" ")}
        >
          <Icon size={18} />
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

/** Nav pill for the section navigator. */
function NavPill({
  label,
  variant,
  onClick,
}: {
  label: string;
  variant?: "accent" | "secondary";
  onClick: () => void;
}) {
  const colors = {
    accent: "bg-accent/10 hover:bg-accent/20 text-accent",
    secondary: "bg-secondary/10 hover:bg-secondary/20 text-secondary",
    default: "bg-gray-100 hover:bg-gray-200 text-brand-text-muted",
  };

  return (
    <button
      onClick={onClick}
      className={[
        "shrink-0 whitespace-nowrap px-3 h-7 flex items-center justify-center rounded-full text-[10px] font-bold transition-all",
        colors[variant || "default"],
      ].join(" ")}
    >
      {label}
    </button>
  );
}
