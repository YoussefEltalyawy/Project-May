import { SDSData, PhysicalProperties } from "@/lib/pubchem";
import { Beaker, AlertTriangle, Heart, Flame, Hand, Package, Shield, Leaf, Trash2, Microscope, AlertCircle } from "lucide-react";

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
    <div className="flex flex-col gap-5 h-full overflow-y-auto pr-1 pb-4">
      {/* Section 2: Physical & Chemical Properties */}
      <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-xl border border-blue-100 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
            <Beaker size={14} className="text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 text-sm">Section 2: Physical & Chemical Properties</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PHYSICAL_PROPS.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1">
              <label
                htmlFor={`phys-${key}`}
                className="block text-xs font-medium text-gray-600"
              >
                {label}
              </label>
              <input
                id={`phys-${key}`}
                type="text"
                value={data.physical[key] || ""}
                onChange={(e) => handlePhysicalChange(key, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all hover:border-gray-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Other Sections */}
      {TEXT_SECTIONS.map(({ num, key, label, icon: Icon }) => {
        const textArray = ((data as unknown) as Record<string, { text?: string[] }>)[key]?.text || [];
        const value = textArray.join("\n\n");

        return (
          <div key={key} className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center">
                <Icon size={12} className="text-gray-600" />
              </div>
              <label
                htmlFor={`editor-${key}`}
                className="text-sm font-semibold text-gray-800"
              >
                Section {num}: {label}
              </label>
            </div>
            <textarea
              id={`editor-${key}`}
              value={value}
              onChange={(e) => handleTextChange(key, e.target.value)}
              placeholder={`Enter details for ${label.toLowerCase()}...`}
              className="w-full min-h-[80px] p-3 text-sm border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/30 resize-y transition-all hover:bg-white"
            />
          </div>
        );
      })}

      {/* Arabic Warning Section */}
      <div className="bg-gradient-to-br from-red-50/50 to-orange-50/30 rounded-xl border border-red-200/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertCircle size={14} className="text-red-600" />
          </div>
          <label
            htmlFor="editor-arabic"
            className="text-sm font-semibold text-red-800"
          >
            {ARABIC_SECTION.label}
          </label>
          <span className="ml-auto text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">RTL</span>
        </div>
        <textarea
          id="editor-arabic"
          value={data.arabicWarning || ""}
          onChange={(e) => onChange({ ...data, arabicWarning: e.target.value })}
          dir="rtl"
          placeholder="تحذير السلامة بالعربية..."
          className="w-full min-h-[120px] p-3 text-base border border-red-200 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white resize-y overflow-auto"
          style={{ fontFamily: "Cairo, sans-serif", lineHeight: "1.6" }}
          spellCheck={false}
        />
      </div>
    </div>
  );
};
