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
 * - "FH" → "HF" (hydrogen fluoride)
 * - "ClK" → "KCl" (potassium chloride - metal first)
 * - "HNaO" → "NaHO" (sodium hydroxide - metal first)
 * - "K2O4S" → "K2SO4" (potassium sulfate - metal first)
 * - "H2Se" → "H2Se" (hydrogen selenide - H first)
 * - "BrH" → "HBr" (hydrogen bromide - H first)
 */

// Set of metal elements for ionic compound ordering (metal first)
const METAL_ELEMENTS = new Set([
  // Alkali metals
  "Li", "Na", "K", "Rb", "Cs", "Fr",
  // Alkaline earth metals
  "Be", "Mg", "Ca", "Sr", "Ba", "Ra",
  // Transition metals
  "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn",
  "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd",
  "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg",
  "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn",
  // Post-transition metals
  "Al", "Ga", "In", "Sn", "Tl", "Pb", "Bi", "Nh", "Fl", "Mc", "Lv",
  // Lanthanides
  "La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu",
  // Actinides
  "Ac", "Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr",
]);

// Elements that form acids with H — in binary compounds, H comes FIRST
// Group 16-17: HCl, HBr, HI, HF, H2S, H2O, H2Se, H2Te
const ACID_ANION_ELEMENTS = new Set([
  // Group 16 (chalcogens)
  "O", "S", "Se", "Te", "Po",
  // Group 17 (halogens)
  "F", "Cl", "Br", "I", "At",
]);

function isMetal(element: string): boolean {
  return METAL_ELEMENTS.has(element);
}

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

  const elementList = Array.from(elements.entries());
  const hasH = elements.has("H");
  const hasO = elements.has("O");
  const hasC = elements.has("C");
  const hCount = elements.get("H") || 0;
  const hasMetal = elementList.some(([el]) => isMetal(el));

  // ─── Organic compounds (C present, no metal): keep Hill notation ───
  // Hill notation IS the conventional notation for organic compounds
  if (hasC && !hasMetal) {
    return formula;
  }

  // ─── Ionic compounds (contain a metal): metal first ───
  // Handles: NaCl, KBr, NaOH, Ca(OH)2, Na2CO3, Fe2O3, K2SO4, etc.
  if (hasMetal) {
    const metals = elementList.filter(([el]) => isMetal(el));
    const nonMetalsNoO = elementList.filter(([el]) => !isMetal(el) && el !== "O" && el !== "H");
    let result = "";

    // Metals first
    for (const [el, count] of metals) {
      result += el + (count > 1 ? count : "");
    }

    // H next (for hydroxides, hydrides, etc.)
    if (hasH) {
      result += "H" + (hCount > 1 ? hCount : "");
    }

    // Other non-metals (central atoms like S, N, P, C in carbonates/cyanides)
    for (const [el, count] of nonMetalsNoO) {
      result += el + (count > 1 ? count : "");
    }

    // O last
    if (hasO) {
      const oCount = elements.get("O") || 0;
      result += "O" + (oCount > 1 ? oCount : "");
    }

    return result;
  }

  // ─── Binary H compounds (no metal, no C): depends on element type ───
  // Acid-forming elements (Group 16-17): H first → HCl, HBr, HI, HF, H2S, H2O
  // Covalent hydride elements (Group 13-15): central atom first → NH3, PH3, BH3, SiH4
  if (hasH && elementList.length === 2) {
    const otherElement = elementList.find(([el]) => el !== "H")?.[0];
    if (otherElement) {
      const otherCount = elements.get(otherElement) || 1;
      if (ACID_ANION_ELEMENTS.has(otherElement)) {
        // Acid: H first (HCl, HBr, HI, HF, H2S, H2Se, H2O)
        return "H" + (hCount > 1 ? hCount : "") + otherElement + (otherCount > 1 ? otherCount : "");
      } else {
        // Covalent hydride: central atom first (NH3, PH3, BH3, SiH4, AsH3)
        return otherElement + (otherCount > 1 ? otherCount : "") + "H" + (hCount > 1 ? hCount : "");
      }
    }
  }

  // ─── Oxoacids (H + O + central atom, no metal): H first, central atom, O last ───
  // Examples: H2SO4, HNO3, H3PO4, HClO4
  if (hasH && hasO && elementList.length >= 3) {
    let result = "H" + (hCount > 1 ? hCount : "");

    const centralAtoms = ["S", "N", "P", "Cl", "Br", "I", "B", "Si", "Se", "Te"];
    const centralAtomEntry = elementList.find(([el]) => centralAtoms.includes(el) && el !== "H" && el !== "O");

    if (centralAtomEntry) {
      const [centralEl, centralCount] = centralAtomEntry;
      result += centralEl + (centralCount > 1 ? centralCount : "");

      const oCount = elements.get("O") || 0;
      if (oCount > 0) {
        result += "O" + (oCount > 1 ? oCount : "");
      }
      return result;
    }
  }

  // ─── Default: H first (if present), then other non-metals, O last ───
  let result = "";

  if (hasH) {
    result += "H" + (hCount > 1 ? hCount : "");
  }

  const nonOxygenNonH = elementList.filter(([el]) => el !== "O" && el !== "H");
  for (const [el, count] of nonOxygenNonH) {
    result += el + (count > 1 ? count : "");
  }

  if (hasO) {
    const oCount = elements.get("O") || 0;
    result += "O" + (oCount > 1 ? oCount : "");
  }

  return result || formula;
}
