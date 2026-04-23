import { SDSData, PhysicalProperties } from "@/lib/pubchem";
import { useState, useMemo } from "react";
import { Beaker, AlertTriangle, Heart, Flame, Hand, Package, Shield, Leaf, Trash2, Microscope, AlertCircle, Maximize2, Minimize2, ArrowLeft } from "lucide-react";

const TEXT_SECTIONS: Array<{ key: keyof Omit<SDSData, "cid" | "identity" | "ghs" | "physical">; label: string; num: string; icon: React.ElementType }> = [
  { num: "3", key: "hazards", label: "Hazards Identification", icon: AlertTriangle },
  { num: "4", key: "firstAid", label: "First Aid Measure", icon: Heart },
  { num: "5", key: "fireFighting", label: "Firefight Measure", icon: Flame },
  { num: "6", key: "handling", label: "Handling", icon: Hand },
  { num: "6", key: "storage", label: "Storage", icon: Package },
  { num: "7", key: "exposure", label: "Exposure Controls / Personal Protection", icon: Shield },
  { num: "8", key: "ecological", label: "Ecological Information", icon: Leaf },
  { num: "9", key: "disposal", label: "Disposal Considerations", icon: Trash2 },
  { num: "10", key: "toxicology", label: "Toxicological Info", icon: Microscope },
];

const ARABIC_SECTION = { key: "arabicWarning", label: "Arabic Safety Warning" };

const PHYSICAL_PROPS: Array<{ key: keyof PhysicalProperties; label: string; placeholder: string }> = [
  { key: "appearance", label: "Appearance", placeholder: "e.g. Colorless liquid" },
  { key: "odor", label: "Odor", placeholder: "e.g. Pungent odor" },
  { key: "boilingPoint", label: "Boiling Point", placeholder: "e.g. 100°C" },
  { key: "meltingPoint", label: "Melting Point", placeholder: "e.g. 0°C" },
  { key: "flashPoint", label: "Flash Point", placeholder: "e.g. 15°C" },
  { key: "density", label: "Density", placeholder: "e.g. 1.0 g/cm³" },
  { key: "vaporPressure", label: "Vapor Pressure", placeholder: "e.g. 23 mmHg at 25°C" },
  { key: "solubility", label: "Solubility", placeholder: "e.g. Miscible in water" },
  { key: "ph", label: "pH", placeholder: "e.g. 7.0" },
  { key: "autoIgnition", label: "Auto-ignition Temp.", placeholder: "e.g. 400°C" },
];

interface SDSEditorProps {
  data: SDSData;
  onChange: (data: SDSData) => void;
}

export const SDSEditor = ({ data, onChange }: SDSEditorProps) => {
  const [focusedSection, setFocusedSection] = useState<string | null>(null);

  const handleTextChange = (key: keyof Omit<SDSData, "cid" | "identity" | "ghs" | "physical">, value: string) => {
    // Split by double newlines or more to keep logical sections distinct 
    // while allowing single newlines for formatting within a section.
    const lines = value
      .split(/\n\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    onChange({
      ...data,
      [key]: { text: lines },
    });
  };

  const handlePhysicalChange = (key: keyof PhysicalProperties, value: string) => {
    onChange({
      ...data,
      physical: {
        ...data.physical,
        [key]: value,
      },
    });
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-10 scroll-smooth custom-scrollbar">
      {/* Header with Focus Indicator */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          {focusedSection ? "Focus Mode" : "All Sections"}
        </h3>
        {focusedSection && (
          <button
            onClick={() => setFocusedSection(null)}
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500 text-white rounded-full text-[10px] font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all"
          >
            <ArrowLeft size={12} />
            Show All Sections
          </button>
        )}
      </div>

      {/* Sticky Section Navigator */}
      {!focusedSection && (
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 py-3 mb-4 flex flex-wrap gap-2 shadow-sm">
          <button 
            onClick={() => document.getElementById('section-meta')?.scrollIntoView({ behavior: 'smooth' })}
            className="shrink-0 whitespace-nowrap px-3 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-[10px] font-bold transition-all shadow-sm"
          >
            SETUP
          </button>
          <button 
            onClick={() => document.getElementById('section-2')?.scrollIntoView({ behavior: 'smooth' })}
            className="shrink-0 whitespace-nowrap px-3 h-7 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-[10px] font-bold transition-all shadow-sm"
          >
            S2. PHYSICAL
          </button>
          {TEXT_SECTIONS.map(({ num, label, key }) => (
            <button 
              key={String(key)} 
              onClick={() => document.getElementById(`section-${String(key)}`)?.scrollIntoView({ behavior: 'smooth' })}
              className="shrink-0 whitespace-nowrap px-3 h-7 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold transition-all shadow-sm"
            >
              S{num}. {label.split(' ')[0].toUpperCase()}
            </button>
          ))}
          <button 
            onClick={() => document.getElementById('section-arabic')?.scrollIntoView({ behavior: 'smooth' })}
            className="shrink-0 whitespace-nowrap px-3 h-7 flex items-center justify-center bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-full text-[10px] font-bold transition-all shadow-sm"
          >
            ARABIC
          </button>
        </div>
      )}

      {/* Preparation Metadata */}
      {(!focusedSection || focusedSection === 'meta') && (
        <div id="section-meta" className="scroll-mt-16 bg-white rounded-2xl border-2 border-gray-100 p-5 shadow-sm transition-all hover:border-indigo-100 focus-within:border-indigo-200 focus-within:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="preparedBy" className="block text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full" />
              General Setup
            </label>
            <button 
              onClick={() => setFocusedSection(focusedSection === 'meta' ? null : 'meta')}
              className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Focus this section"
            >
              {focusedSection === 'meta' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Document Attribution</span>
              <input
                id="preparedBy"
                type="text"
                value={data.preparedBy || ""}
                onChange={(e) => onChange({ ...data, preparedBy: e.target.value })}
                placeholder="e.g. Chemist Maysa Ahmed"
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-gray-50/30 transition-all font-medium"
              />
              {!data.preparedBy && (
                <p className="text-[10px] text-amber-600 flex items-center gap-1.5 font-medium">
                  <AlertCircle size={10} />
                  Hiding attribution line from PDF
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Physical & Chemical Properties */}
      {(!focusedSection || focusedSection === '2') && (
        <div id="section-2" className="scroll-mt-16 bg-gradient-to-br from-blue-50/40 to-indigo-50/20 rounded-2xl border-2 border-blue-100/50 p-5 shadow-sm transition-all hover:border-blue-200 focus-within:shadow-md">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Beaker size={18} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Section 2</h4>
                <p className="text-[11px] text-blue-600 font-bold uppercase tracking-tighter">Physical & Chemical Properties</p>
              </div>
            </div>
            <button 
              onClick={() => setFocusedSection(focusedSection === '2' ? null : '2')}
              className="p-2 text-blue-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-blue-100 shadow-sm"
              title="Focus this section"
            >
              {focusedSection === '2' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PHYSICAL_PROPS.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label htmlFor={`phys-${key}`} className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  {label}
                </label>
                <input
                  id={`phys-${key}`}
                  type="text"
                  value={data.physical[key] || ""}
                  onChange={(e) => handlePhysicalChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 text-sm border-2 border-white/50 rounded-lg shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white transition-all hover:bg-white/80"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Sections */}
      {TEXT_SECTIONS.map(({ num, key, label, icon: Icon }) => {
        const textArray = ((data as unknown) as Record<string, { text?: string[] }>)[String(key)]?.text || [];
        const value = textArray.join("\n\n");
        const isFocused = focusedSection === String(key);

        if (focusedSection && !isFocused) return null;

        return (
          <div key={String(key)} id={`section-${String(key)}`} className={`scroll-mt-16 bg-white rounded-2xl border-2 ${isFocused ? 'border-indigo-500 shadow-2xl' : 'border-gray-100 border-transparent shadow-sm hover:border-indigo-100'} p-5 focus-within:border-indigo-300 focus-within:shadow-lg transition-all group`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm ${isFocused ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-gray-100 text-gray-600 group-hover:bg-indigo-500 group-hover:text-white group-focus-within:bg-indigo-500 group-focus-within:text-white'}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Section {num}</h4>
                  <label htmlFor={`editor-${String(key)}`} className={`text-[11px] font-bold uppercase tracking-tighter transition-colors ${isFocused ? 'text-indigo-600' : 'text-gray-500 group-hover:text-indigo-600'}`}>
                    {label}
                  </label>
                </div>
              </div>
              <button 
                onClick={() => setFocusedSection(isFocused ? null : String(key))}
                className={`p-2 rounded-lg transition-all border ${isFocused ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 border-transparent shadow-sm'}`}
                title={isFocused ? "Exit focus" : "Focus this section"}
              >
                {isFocused ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
            <textarea
              id={`editor-${String(key)}`}
              value={value}
              onChange={(e) => handleTextChange(key, e.target.value)}
              placeholder={`Enter details for ${label.toLowerCase()}...`}
              className={`w-full ${isFocused ? 'min-h-[450px]' : 'min-h-[140px]'} p-4 text-[15px] border-2 border-gray-50 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 bg-gray-50/50 resize-y transition-all hover:bg-white leading-relaxed font-medium`}
            />
            <div className="mt-2 flex justify-between items-center text-[10px] text-gray-400 font-medium px-1">
              <span>Supports multiline text</span>
              <span className="uppercase underline decoration-indigo-200 decoration-2">{String(key).toUpperCase()}</span>
            </div>
          </div>
        );
      })}

      {/* Arabic Warning Section */}
      {(!focusedSection || focusedSection === 'arabic') && (
        <div id="section-arabic" className={`scroll-mt-16 bg-gradient-to-br from-rose-50 to-orange-50/30 rounded-2xl border-2 ${focusedSection === 'arabic' ? 'border-rose-500 shadow-2xl' : 'border-rose-100/50 shadow-sm hover:border-rose-200'} p-5 transition-all focus-within:shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-lg transition-all ${focusedSection === 'arabic' ? 'bg-rose-600 shadow-rose-600/30 grow-0 scale-110' : 'bg-rose-500 shadow-rose-500/20 shadow-sm'}`}>
                <AlertCircle size={18} />
              </div>
              <div>
                <h4 className="font-bold text-rose-900 text-sm">Action Level Warning</h4>
                <p className="text-[11px] text-rose-600 font-bold uppercase tracking-tighter">{ARABIC_SECTION.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-1 bg-rose-500 text-white font-bold rounded-full shadow-sm">RTL</span>
              <button 
                onClick={() => setFocusedSection(focusedSection === 'arabic' ? null : 'arabic')}
                className={`p-2 rounded-lg transition-all border ${focusedSection === 'arabic' ? 'bg-white text-rose-600 border-rose-200' : 'text-rose-400 hover:text-rose-600 hover:bg-white border-transparent shadow-sm'}`}
                title={focusedSection === 'arabic' ? "Exit focus" : "Focus this section"}
              >
                {focusedSection === 'arabic' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>
          <textarea
            id="editor-arabic"
            value={data.arabicWarning || ""}
            onChange={(e) => onChange({ ...data, arabicWarning: e.target.value })}
            dir="rtl"
            placeholder="تحذير السلامة بالعربية..."
            className={`w-full ${focusedSection === 'arabic' ? 'min-h-[450px]' : 'min-h-[160px]'} p-5 text-lg border-2 border-white/50 rounded-xl shadow-inner focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 bg-white/80 resize-y overflow-auto leading-relaxed font-bold`}
            style={{ fontFamily: "Cairo, sans-serif" }}
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
};
