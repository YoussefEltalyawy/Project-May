/**
 * GHS Hazard (H) and Precautionary (P) Statement Mappings
 * source: UN GHS Purple Book / EU CLP
 */

export const GHS_CODES: Record<string, string> = {
  // Hazard Statements (H-Codes)
  "H200": "Unstable explosive",
  "H201": "Explosive; mass explosion hazard",
  "H220": "Extremely flammable gas",
  "H221": "Flammable gas",
  "H222": "Extremely flammable aerosol",
  "H225": "Highly flammable liquid and vapor",
  "H226": "Flammable liquid and vapor",
  "H228": "Flammable solid",
  "H300": "Fatal if swallowed",
  "H301": "Toxic if swallowed",
  "H302": "Harmful if swallowed",
  "H304": "May be fatal if swallowed and enters airways",
  "H310": "Fatal in contact with skin",
  "H311": "Toxic in contact with skin",
  "H312": "Harmful in contact with skin",
  "H314": "Causes severe skin burns and eye damage",
  "H315": "Causes skin irritation",
  "H317": "May cause an allergic skin reaction",
  "H318": "Causes serious eye damage",
  "H319": "Causes serious eye irritation",
  "H330": "Fatal if inhaled",
  "H331": "Toxic if inhaled",
  "H332": "Harmful if inhaled",
  "H335": "May cause respiratory irritation",
  "H336": "May cause drowsiness or dizziness",
  "H340": "May cause genetic defects",
  "H350": "May cause cancer",
  "H351": "Suspected of causing cancer",
  "H360": "May damage fertility or the unborn child",
  "H370": "Causes damage to organs",
  "H372": "Causes damage to organs through prolonged or repeated exposure",
  "H400": "Very toxic to aquatic life",
  "H410": "Very toxic to aquatic life with long lasting effects",
  "H411": "Toxic to aquatic life with long lasting effects",

  // Precautionary Statements (P-Codes)
  "P101": "If medical advice is needed, have product container or label at hand",
  "P102": "Keep out of reach of children",
  "P201": "Obtain special instructions before use",
  "P210": "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking",
  "P260": "Do not breathe dust/fume/gas/mist/vapors/spray",
  "P261": "Avoid breathing dust/fume/gas/mist/vapors/spray",
  "P264": "Wash hands thoroughly after handling",
  "P270": "Do not eat, drink or smoke when using this product",
  "P271": "Use only outdoors or in a well-ventilated area",
  "P273": "Avoid release to the environment",
  "P280": "Wear protective gloves/protective clothing/eye protection/face protection",
  "P301": "IF SWALLOWED:",
  "P302": "IF ON SKIN:",
  "P303": "IF ON SKIN (or hair):",
  "P304": "IF INHALED:",
  "P305": "IF IN EYES:",
  "P310": "Immediately call a POISON CENTER/doctor",
  "P312": "Call a POISON CENTER/doctor if you feel unwell",
  "P314": "Get medical advice/attention if you feel unwell",
  "P316": "Get emergency medical help immediately",
  "P317": "Get medical help",
  "P321": "Specific treatment (see on this label)",
  "P330": "Rinse mouth",
  "P331": "Do NOT induce vomiting",
  "P333": "If skin irritation or rash occurs:",
  "P337": "If eye irritation persists:",
  "P338": "Remove contact lenses, if present and easy to do. Continue rinsing",
  "P340": "Remove person to fresh air and keep comfortable for breathing",
  "P351": "Rinse cautiously with water for several minutes",
  "P353": "Rinse skin with water [or shower]",
  "P354": "Immediately rinse with water for several minutes",
  "P361": "Take off immediately all contaminated clothing",
  "P362": "Take off contaminated clothing",
  "P363": "Wash contaminated clothing before reuse",
  "P391": "Collect spillage",
  "P403": "Store in a well-ventilated place",
  "P405": "Store locked up",
  "P501": "Dispose of contents/container to an approved waste disposal plant",

  // Combined Codes
  "P301+P310": "IF SWALLOWED: Immediately call a POISON CENTER/doctor",
  "P301+P312": "IF SWALLOWED: Call a POISON CENTER/doctor if you feel unwell",
  "P301+P330+P331": "IF SWALLOWED: Rinse mouth. Do NOT induce vomiting",
  "P302+P352": "IF ON SKIN: Wash with plenty of water",
  "P302+P361+P354": "IF ON SKIN: Take off immediately all contaminated clothing. Immediately rinse with water for several minutes",
  "P304+P340": "IF INHALED: Remove person to fresh air and keep comfortable for breathing",
  "P305+P351+P338": "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing",
  "P305+P354+P338": "IF IN EYES: Immediately rinse with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing",
  "P333+P313": "If skin irritation or rash occurs: Get medical advice/attention",
  "P337+P313": "If eye irritation persists: Get medical advice/attention",
  "P370+P378": "In case of fire: Use ... to extinguish",
};

/**
 * Expands H and P codes in a string to their full descriptive text
 */
export function expandGHSCodes(text: string): string {
  if (!text) return "";
  
  // Match patterns like P301, P301+P310, H302
  // We handle combined codes with plus signs first by sorting keys by length
  const keys = Object.keys(GHS_CODES).sort((a, b) => b.length - a.length);
  
  let result = text;
  for (const code of keys) {
    // Escaping the plus sign for regex
    const escapedCode = code.replace(/\+/g, '\\+');
    const regex = new RegExp(`\\b${escapedCode}\\b`, 'g');
    result = result.replace(regex, GHS_CODES[code]);
  }
  
  return result;
}
