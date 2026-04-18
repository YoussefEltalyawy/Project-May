import { SDSData, PhysicalProperties } from "@/lib/pubchem";

const TEXT_SECTIONS: Array<{ key: keyof Omit<SDSData, "cid" | "identity" | "ghs" | "physical">; label: string; num: string }> = [
  { num: "3", key: "hazards", label: "Hazards Identification" },
  { num: "4", key: "firstAid", label: "First Aid Measure" },
  { num: "5", key: "fireFighting", label: "Firefight Measure" },
  { num: "6", key: "handling", label: "Handling" },
  { num: "6", key: "storage", label: "Storage" },
  { num: "7", key: "exposure", label: "Exposure Controls / Personal Protection" },
  { num: "8", key: "ecological", label: "Ecological Information" },
  { num: "9", key: "disposal", label: "Disposal Considerations" },
  { num: "10", key: "toxicology", label: "Toxicological Info" },
];

const PHYSICAL_PROPS: Array<{ key: keyof PhysicalProperties; label: string }> = [
  { key: "appearance", label: "Appearance" },
  { key: "odor", label: "Odor" },
  { key: "boilingPoint", label: "Boiling Point" },
  { key: "meltingPoint", label: "Melting Point" },
  { key: "flashPoint", label: "Flash Point" },
  { key: "density", label: "Density" },
  { key: "vaporPressure", label: "Vapor Pressure" },
  { key: "solubility", label: "Solubility" },
  { key: "ph", label: "pH" },
  { key: "autoIgnition", label: "Auto-ignition Temp." },
];

interface SDSEditorProps {
  data: SDSData;
  onChange: (data: SDSData) => void;
}

export const SDSEditor = ({ data, onChange }: SDSEditorProps) => {
  const handleTextChange = (key: keyof Omit<SDSData, "cid" | "identity" | "ghs" | "physical">, value: string) => {
    const lines = value
      .split("\n")
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
    <div className="flex flex-col gap-6 max-h-[min(85vh,56rem)] min-h-[28rem] h-[calc(100dvh-10rem)] overflow-y-auto pr-2 custom-scrollbar">
      {/* Section 2: Physical & Chemical Properties */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-md border-l-2 border-indigo-600">
          Section 2: Physical & Chemical Properties (Metric Units)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PHYSICAL_PROPS.map(({ key, label }) => (
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
                placeholder="-"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Other Sections */}
      {TEXT_SECTIONS.map(({ num, key, label }) => {
        const textArray = ((data as unknown) as Record<string, { text?: string[] }>)[key]?.text || [];
        const value = textArray.join("\n\n");

        return (
          <div key={key} className="space-y-2">
            <label
              htmlFor={`editor-${key}`}
              className="block text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-md border-l-2 border-indigo-600"
            >
              Section {num}: {label}
            </label>
            <textarea
              id={`editor-${key}`}
              value={value}
              onChange={(e) => handleTextChange(key, e.target.value)}
              placeholder={`Enter details for ${label.toLowerCase()}...`}
              className="w-full min-h-[100px] p-3 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white resize-y"
            />
          </div>
        );
      })}
    </div>
  );
};
