import { SDSData } from "@/lib/pubchem";

const SECTIONS: Array<{ key: keyof Omit<SDSData, "cid" | "identity" | "ghs" | "physical">; label: string; num: string }> = [
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

interface SDSEditorProps {
  data: SDSData;
  onChange: (data: SDSData) => void;
}

export const SDSEditor = ({ data, onChange }: SDSEditorProps) => {
  const handleTextChange = (key: keyof typeof data, value: string) => {
    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    onChange({
      ...data,
      [key]: { text: lines },
    });
  };

  return (
    <div className="flex flex-col gap-6 max-h-[min(85vh,56rem)] min-h-[28rem] h-[calc(100dvh-10rem)] overflow-y-auto pr-2 custom-scrollbar">
      {SECTIONS.map(({ num, key, label }) => {
        const textArray = (data as any)[key]?.text || [];
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
