import { normalizeGhsPictogramCode, normalizeGhsPictogramCodes } from "@/lib/ghsMapping";
import type { PrecautionaryGroup } from "@/lib/ghsFormat";
import {
  mergePictogramSources,
  dedupeHazardStatements,
  buildPrecautionaryFromCorpus,
} from "@/lib/ghsFormat";

export type { PrecautionaryGroup } from "@/lib/ghsFormat";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChemicalIdentity {
  name: string;
  iupacName: string;
  cas: string;
  formula: string;
  molecularWeight: string;
  synonyms: string[];
  inchiKey: string;
}

export interface GHSData {
  pictograms: string[];
  signalWord: string;
  hazardStatements: string[];
  precautionaryStatements: string[];
  /** Grouped P-statements for display (optional). */
  precautionaryGrouped?: PrecautionaryGroup[];
}

export interface PhysicalProperties {
  appearance: string;
  boilingPoint: string;
  meltingPoint: string;
  flashPoint: string;
  density: string;
  vaporPressure: string;
  solubility: string;
  ph: string;
  odor: string;
  autoIgnition: string;
}

export interface SDSData {
  cid: string;
  identity: ChemicalIdentity;
  ghs: GHSData;
  physical: PhysicalProperties;
  hazards: { text: string[] };
  composition: { text: string[] };
  firstAid: { text: string[] };
  fireFighting: { text: string[] };
  accidentalRelease: { text: string[] };
  handling: { text: string[] };
  storage: { text: string[] };
  exposure: { text: string[] };
  stability: { text: string[] };
  toxicology: { text: string[] };
  ecological: { text: string[] };
  disposal: { text: string[] };
  transport: { text: string[] };
  regulatory: { text: string[] };
  otherInfo: { text: string[] };
}

// ─── API constants ────────────────────────────────────────────────────────────

const PUG = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
const PUG_VIEW = "https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound";
const AUTOCOMPLETE = "https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound";

// ─── HTTP ─────────────────────────────────────────────────────────────────────

async function fetchJsonWithRetry(url: string, init?: RequestInit): Promise<Response> {
  const backoffMs = [0, 600, 1600];
  let last: Response | undefined;
  for (let i = 0; i < backoffMs.length; i++) {
    if (backoffMs[i]) await new Promise(r => setTimeout(r, backoffMs[i]));
    last = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
    });
    if (last.ok) return last;
    if (last.status !== 429 && last.status !== 503) return last;
  }
  return last!;
}

async function fetchCompoundPugViewJson(cid: string, toc?: string): Promise<unknown | null> {
  let url = `${PUG_VIEW}/${cid}/JSON`;
  if (toc) url += `?${new URLSearchParams({ toc })}`;
  try {
    const res = await fetchJsonWithRetry(url);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Generic extractors ───────────────────────────────────────────────────────

function collectStrings(node: unknown, out: string[] = []): string[] {
  if (!node || typeof node !== "object") return out;
  const n = node as Record<string, unknown>;

  if (Array.isArray(n.StringWithMarkup)) {
    for (const item of n.StringWithMarkup as Record<string, unknown>[]) {
      const s = item.String as string | undefined;
      if (s && s.trim()) out.push(s.trim());
    }
  }
  for (const val of Object.values(n)) {
    if (Array.isArray(val)) val.forEach(v => collectStrings(v, out));
    else if (val && typeof val === "object") collectStrings(val, out);
  }
  return out;
}

function findSection(root: unknown, ...headings: string[]): unknown[] {
  const lower = headings.map(h => h.toLowerCase());
  const out: unknown[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    const heading = (n.TOCHeading as string | undefined)?.toLowerCase() ?? "";
    if (lower.includes(heading)) {
      out.push(n);
      return;
    }
    if (Array.isArray(n.Section)) (n.Section as unknown[]).forEach(walk);
    if (n.Record) walk(n.Record);
  }

  walk(root);
  return out;
}

function findSectionMany(roots: unknown[], ...headings: string[]): unknown[] {
  const acc: unknown[] = [];
  for (const r of roots) acc.push(...findSection(r, ...headings));
  return acc;
}

function textsFromSections(sections: unknown[], minLen = 8, limit = 80): string[] {
  const all: string[] = [];
  for (const s of sections) collectStrings(s, all);
  return Array.from(new Set(all.filter(t => t.length >= minLen))).slice(0, limit);
}

function collectStringsFromNodes(nodes: unknown[]): string[] {
  const out: string[] = [];
  for (const n of nodes) collectStrings(n, out);
  return out;
}

// ─── GHS ──────────────────────────────────────────────────────────────────────

function extractPictogramCodesFromSections(sections: unknown[]): string[] {
  const codes = new Set<string>();
  const flexible = /GHS\s*0?\s*([1-9])/gi;

  for (const sec of sections) {
    const allStrings = collectStrings(sec);
    for (const s of allStrings) {
      let m: RegExpExecArray | null;
      flexible.lastIndex = 0;
      while ((m = flexible.exec(s)) !== null) {
        const n = normalizeGhsPictogramCode(`GHS0${m[1]}`);
        if (n) codes.add(n);
      }
      const legacy = s.match(/GHS0[1-9]/g);
      if (legacy) {
        for (const x of legacy) {
          const n = normalizeGhsPictogramCode(x);
          if (n) codes.add(n);
        }
      }
    }

    function walkMarkup(node: unknown) {
      if (!node || typeof node !== "object") return;
      const n = node as Record<string, unknown>;
      if (typeof n.Extra === "string") {
        const n2 = normalizeGhsPictogramCode(n.Extra);
        if (n2) codes.add(n2);
      }
      for (const val of Object.values(n)) {
        if (Array.isArray(val)) val.forEach(walkMarkup);
        else if (val && typeof val === "object") walkMarkup(val);
      }
    }
    walkMarkup(sec);
  }

  return normalizeGhsPictogramCodes(Array.from(codes)).sort((a, b) => a.localeCompare(b));
}

function parseGHSFromRoots(views: unknown[]): GHSData {
  const def: GHSData = {
    pictograms: [],
    signalWord: "Warning",
    hazardStatements: [],
    precautionaryStatements: [],
  };
  if (!views.length) return def;

  const ghsSec = findSectionMany(views, "ghs classification");
  const pictSec = findSectionMany(views, "pictogram(s)", "pictograms");
  const signSec = findSectionMany(views, "signal", "signal word");
  const hazSec = findSectionMany(views, "ghs hazard statements", "hazard statements", "hazard statement codes");
  const precSec = findSectionMany(views, "precautionary statement codes", "precautionary statements");

  const pictograms = extractPictogramCodesFromSections([...ghsSec, ...pictSec]);

  let signalWord = "";
  for (const t of textsFromSections(signSec, 1, 20)) {
    if (t === "Danger" || t === "Warning") {
      signalWord = t;
      break;
    }
  }
  if (!signalWord) {
    for (const t of collectStringsFromNodes(views)) {
      if (t === "Danger") {
        signalWord = "Danger";
        break;
      }
      if (t === "Warning") {
        signalWord = "Warning";
        break;
      }
    }
  }

  const hazPool = hazSec.length ? collectStringsFromNodes(hazSec) : collectStringsFromNodes(views);
  const precPool = precSec.length ? collectStringsFromNodes(precSec) : collectStringsFromNodes(views);

  const hRaw = hazPool.filter(t => /H\d{3}/.test(t));
  const pRaw = precPool.filter(t => /P\d{3}/i.test(t));

  return {
    pictograms,
    signalWord: signalWord || "Warning",
    hazardStatements: hRaw.slice(0, 160),
    precautionaryStatements: pRaw.slice(0, 160),
  };
}

/** Subtrees where GHS pictogram URLs are authoritative — not the full PUG-View record. */
function findGhsPictogramSectionRoots(views: unknown[]): unknown[] {
  return findSectionMany(
    views,
    "ghs classification",
    "pictogram(s)",
    "pictograms",
    "ghs hazard classification",
    "classification of the substance or mixture"
  );
}

function finalizeGhs(views: unknown[], ghs: GHSData): GHSData {
  const pictSectionRoots = findGhsPictogramSectionRoots(views);
  const pictograms = mergePictogramSources(pictSectionRoots, ghs.pictograms);
  const hazardStatements = dedupeHazardStatements(ghs.hazardStatements).slice(0, 120);
  const corpus: string[] = [];
  for (const t of collectStringsFromNodes(views)) {
    if (/P\d{3}/i.test(t)) corpus.push(t);
  }
  corpus.push(...ghs.precautionaryStatements);
  const { flatLines, grouped } = buildPrecautionaryFromCorpus(corpus, views);
  return {
    ...ghs,
    pictograms,
    hazardStatements,
    precautionaryStatements: flatLines.length ? flatLines : ghs.precautionaryStatements,
    precautionaryGrouped: grouped.length ? grouped : undefined,
  };
}

// ─── Identity & search ────────────────────────────────────────────────────────

export async function getCIDByName(name: string): Promise<string | null> {
  try {
    const res = await fetchJsonWithRetry(`${PUG}/compound/name/${encodeURIComponent(name)}/cids/JSON`);
    if (!res.ok) return null;
    const data = await res.json();
    const cids = data?.IdentifierList?.CID as number[] | undefined;
    return cids?.[0] ? String(cids[0]) : null;
  } catch {
    return null;
  }
}

export async function autocompleteCompoundNames(query: string, limit = 10): Promise<string[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetchJsonWithRetry(`${AUTOCOMPLETE}/${encodeURIComponent(q)}/json?limit=${limit + 4}`);
    if (!res.ok) return [];
    const data = await res.json();
    const list = data?.dictionary_terms?.compound as string[] | undefined;
    if (!Array.isArray(list)) return [];
    return Array.from(new Set(list.map((t: string) => t.trim()).filter(Boolean))).slice(0, limit);
  } catch {
    return [];
  }
}

export async function getChemicalIdentity(cid: string): Promise<ChemicalIdentity> {
  const result: ChemicalIdentity = {
    name: "",
    iupacName: "",
    cas: "",
    formula: "",
    molecularWeight: "",
    synonyms: [],
    inchiKey: "",
  };
  try {
    const propRes = await fetchJsonWithRetry(
      `${PUG}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,Title,InChIKey/JSON`
    );
    if (propRes.ok) {
      const d = await propRes.json();
      const p = d?.PropertyTable?.Properties?.[0] ?? {};
      result.name = p.Title ?? "";
      result.formula = p.MolecularFormula ?? "";
      result.molecularWeight = p.MolecularWeight ? `${p.MolecularWeight} g/mol` : "";
      result.iupacName = p.IUPACName ?? "";
      result.inchiKey = p.InChIKey ?? "";
    }
  } catch { /* continue */ }

  try {
    const synRes = await fetchJsonWithRetry(`${PUG}/compound/cid/${cid}/synonyms/JSON`);
    if (synRes.ok) {
      const d = await synRes.json();
      const all: string[] = d?.InformationList?.Information?.[0]?.Synonym ?? [];
      const cas = all.find(s => /^\d{2,7}-\d{2}-\d$/.test(s));
      if (cas) result.cas = cas;
      result.synonyms = all
        .filter(s => !/^\d{2,7}-\d{2}-\d$/.test(s) && s.length < 80)
        .slice(0, 14);
    }
  } catch { /* continue */ }

  return result;
}

// ─── Physical properties ───────────────────────────────────────────────────────

const headingMap: Array<[keyof PhysicalProperties, string[]]> = [
  ["appearance", ["Physical Description", "Appearance", "Color/Form"]],
  ["boilingPoint", ["Boiling Point"]],
  ["meltingPoint", ["Melting Point"]],
  ["flashPoint", ["Flash Point"]],
  ["density", ["Density", "Specific Gravity"]],
  ["vaporPressure", ["Vapor Pressure"]],
  ["solubility", ["Solubility", "Solubility in Water"]],
  ["ph", ["pH"]],
  ["odor", ["Odor"]],
  ["autoIgnition", ["Autoignition Temperature"]],
];

function getPhysicalPropertiesFromViews(views: unknown[]): PhysicalProperties {
  const p: PhysicalProperties = {
    appearance: "",
    boilingPoint: "",
    meltingPoint: "",
    flashPoint: "",
    density: "",
    vaporPressure: "",
    solubility: "",
    ph: "",
    odor: "",
    autoIgnition: "",
  };
  if (!views.length) return p;

  for (const [key, headings] of headingMap) {
    const sections = findSectionMany(views, ...headings.map(h => h.toLowerCase()));
    if (sections.length > 0) {
      const texts = textsFromSections(sections, 1, 6);
      if (texts.length) p[key] = texts[0];
    }
  }

  return p;
}

function getSectionTextsFromViews(
  views: unknown[],
  minLen: number,
  limit: number,
  ...headings: string[]
): { text: string[] } {
  const sections = findSectionMany(views, ...headings.map(h => h.toLowerCase()));
  if (!sections.length) return { text: [] };
  return { text: textsFromSections(sections, minLen, limit) };
}

// ─── Aggregate ────────────────────────────────────────────────────────────────

export async function fetchFullSDSByCid(cid: string, fallbackName?: string): Promise<SDSData | null> {
  const [main, lcss, identity] = await Promise.all([
    fetchCompoundPugViewJson(cid),
    fetchCompoundPugViewJson(cid, "LCSS TOC"),
    getChemicalIdentity(cid),
  ]);

  const views: unknown[] = [];
  if (main) views.push(main);
  if (lcss) views.push(lcss);

  if (!views.length && !identity.name && !fallbackName) return null;

  const ghs = finalizeGhs(views, parseGHSFromRoots(views));
  const physical = getPhysicalPropertiesFromViews(views);

  const hazards = getSectionTextsFromViews(
    views, 6, 100,
    "Hazards Identification", "GHS Classification", "Hazard Statements", "Hazards",
    "Hazard Identification", "Classification of the Substance or Mixture"
  );
  const composition = getSectionTextsFromViews(
    views, 6, 60,
    "Composition/Information on Ingredients", "Composition", "Ingredients", "Components"
  );
  const firstAid = getSectionTextsFromViews(
    views, 6, 100,
    "First Aid Measures", "First-Aid Measures", "First Aid", "Emergency Medical Treatment",
    "Emergency Treatment", "Human Toxicity Excerpts", "Treatment", "Medical Surveillance"
  );
  const fireFighting = getSectionTextsFromViews(
    views, 6, 80,
    "Fire-Fighting Measures", "Fire Fighting Measures", "Fire Hazard", "Extinguishing Media",
    "Firefighting", "Fire Fighting"
  );
  const accidentalRelease = getSectionTextsFromViews(
    views, 6, 80,
    "Accidental Release Measures", "Spills and Leaks", "Spill or Leak Procedures", "Accidental Release"
  );
  const handling = getSectionTextsFromViews(
    views, 6, 80,
    "Handling and Storage", "Safe Handling", "Handling", "Safe Use", "Industrial Hygiene"
  );
  const storage = getSectionTextsFromViews(views, 6, 60, "Storage", "Storage Conditions", "Shelf Life");
  const exposure = getSectionTextsFromViews(
    views,
    6,
    100,
    "Exposure Standards and Regulations",
    "Occupational Exposure Limits",
    "Exposure Limits",
    "NIOSH Pocket Guide",
    "Personal Protective Equipment (PPE)",
    "Personal Protective Equipment",
    "Exposure Controls"
  );
  const stability = getSectionTextsFromViews(
    views, 6, 80,
    "Stability and Reactivity", "Stability/Reactivity", "Stability", "Reactivity", "Hazardous Reactions"
  );
  const toxicology = getSectionTextsFromViews(
    views, 6, 100,
    "Toxicological Information", "Toxicity", "Health Effects", "Human Toxicity Values",
    "Non-Human Toxicity Values", "Toxicological Effects"
  );
  const ecological = getSectionTextsFromViews(
    views, 6, 80,
    "Ecological Information", "Ecotoxicity", "Environmental Fate", "Ecological Analyses",
    "Environmental Hazard"
  );
  const disposal = getSectionTextsFromViews(
    views, 6, 60,
    "Disposal Methods", "Waste Disposal Methods", "Disposal", "Waste Treatment Methods"
  );
  const transport = getSectionTextsFromViews(
    views, 6, 60,
    "Transport Information", "DOT Classification", "Shipping Name", "UN Classification",
    "Transport Hazard Class"
  );
  const regulatory = getSectionTextsFromViews(
    views, 6, 60,
    "Regulatory Information", "US Federal Regulations", "State Regulations", "Federal Regulatory",
    "Safety and Hazard", "Listings"
  );
  const otherInfo = getSectionTextsFromViews(
    views, 6, 50,
    "Other Information", "General Remarks", "Chemical Safety Summary", "Version History"
  );

  if (!identity.name) identity.name = fallbackName ?? "";

  return {
    cid,
    identity,
    ghs,
    physical,
    hazards,
    composition,
    firstAid,
    fireFighting,
    accidentalRelease,
    handling,
    storage,
    exposure,
    stability,
    toxicology,
    ecological,
    disposal,
    transport,
    regulatory,
    otherInfo,
  };
}

export async function fetchFullSDS(name: string): Promise<SDSData | null> {
  const cid = await getCIDByName(name);
  if (!cid) return null;
  return fetchFullSDSByCid(cid, name);
}

