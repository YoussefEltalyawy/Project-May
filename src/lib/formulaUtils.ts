/**
 * Convert Hill notation formula to conventional notation.
 * Hill: C first (if present), H second (if C present), then alphabetical.
 * Conventional: H first for acids, central element, O last.
 *
 * Examples:
 * - "H2O4S" → "H2SO4" (sulfuric acid)
 * - "CH4" → "CH4" (methane, no change)
 * - "C6H12O6" → "C6H12O6" (glucose, no change)
 * - "ClH" → "HCl" (hydrochloric acid)
 * - "NaCl" → "NaCl" (sodium chloride, no change)
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

  // Build conventional formula for inorganic compounds:
  // H first (for acids/hydrides), then others (excluding O), then O last
  let result = "";

  // Hydrogen first (common convention for acids and hydrides)
  if (elements.has("H")) {
    const hCount = elements.get("H")!;
    result += "H" + (hCount > 1 ? hCount : "");
    elements.delete("H");
  }

  // Then other elements except O, in order they appeared (maintains common conventions)
  const nonOxygenElements = Array.from(elements.entries()).filter(([el]) => el !== "O");
  for (const [el, count] of nonOxygenElements) {
    result += el + (count > 1 ? count : "");
  }

  // Oxygen last (common for oxoacids and oxides)
  if (elements.has("O")) {
    const oCount = elements.get("O")!;
    result += "O" + (oCount > 1 ? oCount : "");
  }

  return result || formula;
}
