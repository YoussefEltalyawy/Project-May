/**
 * Convert Hill notation formula to conventional notation.
 * Hill: C first (if present), H second (if C present), then alphabetical.
 * Conventional: depends on compound type.
 *
 * Examples:
 * - "H2O4S" → "H2SO4" (sulfuric acid)
 * - "CH4" → "CH4" (methane, no change)
 * - "C6H12O6" → "C6H12O6" (glucose, no change)
 * - "ClH" → "HCl" (hydrochloric acid)
 * - "H3N" → "NH3" (ammonia - central atom first)
 * - "NaCl" → "NaCl" (sodium chloride, no change)
 * - "FH" → "HF" (hydrogen fluoride - central atom first)
 */
export function reorderFormula(formula: string): string {
  if (!formula) return formula;

  // Parse formula into elements and counts
  const elementRegex = /([A-Z][a-z]?)(\d*)/g;
  const elements: Map<string, number> = new Map();
  let match;

  while ((match = elementRegex.exec(formula)) !== null) {
    const [, element, countStr] = match;
    const count = countStr ? parseInt(countStr, 10) : 1;
    elements.set(element, (elements.get(element) || 0) + count);
  }

  if (elements.size === 0) return formula;

  // If formula contains Carbon, it's likely organic - keep Hill notation (C first)
  if (elements.has("C")) {
    return formula;
  }

  // Inorganic compounds - need smart reordering
  const elementList = Array.from(elements.entries());
  const hasH = elements.has("H");
  const hasO = elements.has("O");
  const hCount = elements.get("H") || 0;

  // Binary compounds with H (like NH3, PH3, HF, HCl)
  // Central atom (more electronegative or larger) comes first, H last
  if (hasH && elementList.length === 2) {
    const otherElement = elementList.find(([el]) => el !== "H")?.[0];
    if (otherElement) {
      const otherCount = elements.get(otherElement) || 1;
      return otherElement + (otherCount > 1 ? otherCount : "") + "H" + (hCount > 1 ? hCount : "");
    }
  }

  // Acids with O (oxoacids): H first, then central atom, then O
  // Examples: H2SO4, HNO3, H3PO4, HClO4
  if (hasH && hasO && elementList.length >= 3) {
    let result = "H" + (hCount > 1 ? hCount : "");

    // Central atom (non-H, non-O, usually the "acid" element like S, N, P, Cl)
    const centralAtoms = ["S", "N", "P", "Cl", "Br", "I", "C", "B", "Si"];
    const centralAtomEntry = elementList.find(([el]) => centralAtoms.includes(el) && el !== "H" && el !== "O");

    if (centralAtomEntry) {
      const [centralEl, centralCount] = centralAtomEntry;
      result += centralEl + (centralCount > 1 ? centralCount : "");

      // O last
      const oCount = elements.get("O") || 0;
      if (oCount > 0) {
        result += "O" + (oCount > 1 ? oCount : "");
      }
      return result;
    }
  }

  // Hydracids (H + one other element, no O): H first
  // Examples: HCl, HBr, HI, HF
  if (hasH && !hasO && elementList.length === 2) {
    const otherElement = elementList.find(([el]) => el !== "H")?.[0];
    if (otherElement) {
      const otherCount = elements.get(otherElement) || 1;
      return "H" + (hCount > 1 ? hCount : "") + otherElement + (otherCount > 1 ? otherCount : "");
    }
  }

  // Default: H first for remaining cases, then others, O last
  let result = "";

  if (hasH) {
    result += "H" + (hCount > 1 ? hCount : "");
  }

  // Other elements except O
  const nonOxygenElements = elementList.filter(([el]) => el !== "O" && el !== "H");
  for (const [el, count] of nonOxygenElements) {
    result += el + (count > 1 ? count : "");
  }

  // O last
  if (hasO) {
    const oCount = elements.get("O") || 0;
    result += "O" + (oCount > 1 ? oCount : "");
  }

  return result || formula;
}
