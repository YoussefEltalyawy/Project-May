import { normalizeGhsPictogramCode, normalizeGhsPictogramCodes } from "@/lib/ghsMapping";

/** Common GHS precautionary statement text (Rev.9-style wording, abbreviated where long). */
const P_TEXT: Record<string, string> = {
  P101: "If medical advice is needed, have product container or label at hand.",
  P102: "Keep out of reach of children.",
  P103: "Read label before use.",
  P201: "Obtain special instructions before use.",
  P202: "Do not handle until all safety precautions have been read and understood.",
  P210: "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking.",
  P211: "Do not spray on an open flame or other ignition source.",
  P220: "Keep away from clothing and other combustible materials.",
  P221: "Take any precaution to avoid mixing with combustibles/…",
  P222: "Do not allow contact with air.",
  P223: "Do not allow contact with water.",
  P230: "Keep contents under …/gas …",
  P231: "Handle and store contents under inert gas/…",
  P232: "Protect from moisture.",
  P233: "Keep container tightly closed.",
  P234: "Keep only in original packaging.",
  P235: "Keep cool.",
  P236: "Keep only in original container.",
  P237: "Keep container tightly closed in a cool/well-ventilated place.",
  P238: "Keep in a dry place.",
  P239: "Keep container tightly closed in a dry/well-ventilated place.",
  P240: "Ground and bond container and receiving equipment.",
  P241: "Use explosion-proof electrical/ventilating/lighting/…/equipment.",
  P242: "Use only non-sparking tools.",
  P243: "Take precautionary measures against static discharge.",
  P244: "Keep valves and fittings free from oil and grease.",
  P250: "Do not subject to grinding/shock/…/friction.",
  P251: "Do not pierce or burn, even after use.",
  P260: "Do not breathe dust/fume/gas/mist/vapours/spray.",
  P261: "Avoid breathing dust/fume/gas/mist/vapours/spray.",
  P262: "Do not get in eyes, on skin, or on clothing.",
  P263: "Avoid contact during pregnancy and while nursing.",
  P264: "Wash … thoroughly after handling.",
  P270: "Do not eat, drink or smoke when using this product.",
  P271: "Use only outdoors or in a well-ventilated area.",
  P272: "Contaminated work clothing should not be allowed out of the workplace.",
  P273: "Avoid release to the environment.",
  P280: "Wear protective gloves/protective clothing/eye protection/face protection.",
  P281: "Use personal protective equipment as required.",
  P282: "Wear cold insulating gloves/face shield/eye protection.",
  P283: "Wear fire resistant or flame retardant clothing.",
  P284: "Wear respiratory protection in case of inadequate ventilation.",
  P301: "IF SWALLOWED:",
  P302: "IF ON SKIN:",
  P303: "IF ON SKIN (or hair):",
  P304: "IF INHALED:",
  P305: "IF IN EYES:",
  P306: "IF ON CLOTHING:",
  P308: "IF exposed or concerned:",
  P310: "Immediately call a POISON CENTER/doctor/…",
  P311: "Call a POISON CENTER/doctor/…",
  P312: "Call a POISON CENTER/doctor/…/if you feel unwell.",
  P313: "Get medical advice/attention.",
  P314: "Get medical advice/attention if you feel unwell.",
  P315: "Get immediate medical advice/attention.",
  P316: "Get emergency medical help immediately.",
  P320: "Specific treatment is urgent (see … on this label).",
  P321: "Specific treatment (see … on this label).",
  P330: "Rinse mouth.",
  P331: "Do NOT induce vomiting.",
  P332: "If skin irritation occurs:",
  P333: "If skin irritation or rash occurs:",
  P334: "Immerse in cool water/wrap in wet bandages.",
  P335: "Brush off loose particles from skin.",
  P336: "Immediately thaw frosted parts with lukewarm water. Do not rub affected area.",
  P337: "If eye irritation persists:",
  P338: "Remove contact lenses, if present and easy to do. Continue rinsing.",
  P340: "Remove person to fresh air and keep comfortable for breathing.",
  P342: "If experiencing respiratory symptoms:",
  P351: "Rinse cautiously with water for several minutes.",
  P352: "Wash with plenty of water/…",
  P353: "Rinse skin with water/shower.",
  P354: "Immediately rinse with water for several minutes.",
  P361: "Take off immediately all contaminated clothing.",
  P362: "Take off contaminated clothing.",
  P363: "Wash contaminated clothing before reuse.",
  P364: "And wash it before reuse.",
  P370: "In case of fire:",
  P371: "In case of major fire and large quantities:",
  P372: "Explosion risk in case of fire.",
  P373: "DO NOT fight fire when fire reaches explosives.",
  P374: "Fight fire with normal precautions from a reasonable distance.",
  P375: "Fight fire remotely due to the risk of explosion.",
  P376: "Stop leak if safe to do so.",
  P377: "Leaking gas fire: Do not extinguish, unless leak can be stopped safely.",
  P378: "Use … to extinguish.",
  P380: "Evacuate area.",
  P381: "Eliminate all ignition sources if safe to do so.",
  P390: "Absorb spillage to prevent material damage.",
  P391: "Collect spillage.",
  P401: "Store in accordance with …",
  P402: "Store in a dry place.",
  P403: "Store in a well-ventilated place.",
  P404: "Store in a closed container.",
  P405: "Store locked up.",
  P406: "Store in corrosive resistant/… container with a resistant inner liner.",
  P407: "Maintain air gap between stacks/pallets.",
  P410: "Protect from sunlight.",
  P411: "Store at temperatures not exceeding … °C/… °F.",
  P412: "Do not expose to temperatures exceeding 50 °C/122 °F.",
  P413: "Store bulk masses greater than … °C/… °F.",
  P420: "Store away from other materials.",
  P422: "Store contents under …",
  P501: "Dispose of contents/container to …",
  P502: "Refer to manufacturer/supplier for information on recovery/recycling.",
  P503: "Refer to manufacturer/supplier for … information.",
};

function expandPPhrase(token: string): string {
  const parts = token.split("+").map(s => s.trim()).filter(Boolean);
  const bits = parts.map((p) => {
    const base = p.match(/^(P\d{3}[A-Za-z]*)/)?.[1] ?? p;
    const text = P_TEXT[base];
    if (text) return `${base}: ${text}`;
    return `${base} (full wording on product label)`;
  });
  return bits.join(" · ");
}

function pCategoryHeading(pCode: string): string {
  const m = pCode.match(/^P(\d)/i);
  const series = m ? m[1] : "0";
  if (series === "1") return "General";
  if (series === "2") return "Prevention";
  if (series === "3") return "Response";
  if (series === "4") return "Storage";
  if (series === "5") return "Disposal";
  return "Other";
}

/**
 * Walk a **bounded** subtree (e.g. GHS Classification / Pictogram section only) and collect
 * pictogram codes from PubChem-hosted GHS asset URLs. Does not scan the full compound record,
 * so generic icons elsewhere (e.g. environmental chapters) are not picked up.
 */
export function extractPictogramCodesFromUrls(root: unknown): string[] {
  const found = new Set<string>();
  const rePub = /(?:https:\/\/)?pubchem\.ncbi\.nlm\.nih\.gov\/images\/ghs\/(GHS\d{2})\.(?:svg|png)/i;

  function walk(node: unknown) {
    if (!node) return;
    if (typeof node === "string") {
      const m = node.match(rePub);
      if (m) {
        const n = normalizeGhsPictogramCode(m[1].toUpperCase());
        if (n) found.add(n);
      }
      return;
    }
    if (typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const n = node as Record<string, unknown>;
    if (typeof n.URL === "string") walk(n.URL);
    if (Array.isArray(n.URL)) (n.URL as string[]).forEach(walk);
    for (const v of Object.values(n)) walk(v);
  }

  walk(root);
  return normalizeGhsPictogramCodes(Array.from(found)).sort((a, b) => a.localeCompare(b));
}

const P_ANY = /P\d{3}[A-Za-z]*(?:\+P\d{3}[A-Za-z]*)*/gi;

export function extractPCodesFromText(text: string): string[] {
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  P_ANY.lastIndex = 0;
  while ((m = P_ANY.exec(text)) !== null) seen.add(m[0].toUpperCase());
  return Array.from(seen);
}

export function extractPTokensFromUrlString(u: string): string[] {
  const seen = new Set<string>();
  for (const m of u.matchAll(/#(P\d{3}(?:\+P\d{3})*)/gi)) seen.add(m[1].toUpperCase());
  return Array.from(seen);
}

function walkUrls(node: unknown, sink: (s: string) => void) {
  if (typeof node === "string") {
    if (node.startsWith("http")) sink(node);
    return;
  }
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach(n => walkUrls(n, sink));
    return;
  }
  const n = node as Record<string, unknown>;
  if (typeof n.URL === "string") sink(n.URL);
  if (Array.isArray(n.URL)) (n.URL as string[]).forEach(sink);
  for (const v of Object.values(n)) walkUrls(v, sink);
}

export function extractPFromUrlsInTree(root: unknown): string[] {
  const out = new Set<string>();
  walkUrls(root, (u) => {
    for (const t of extractPTokensFromUrlString(u)) out.add(t);
  });
  return Array.from(out);
}

/** Dedupe hazard lines by leading H### code (keeps first full line per code). */
export function dedupeHazardStatements(lines: string[]): string[] {
  const by = new Map<string, string>();
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/(H\d{3}[A-Za-z+]*)/i);
    const key = m ? m[1].toUpperCase() : line.slice(0, 40);
    const prev = by.get(key);
    if (!prev || line.length > prev.length) by.set(key, line);
  }
  return [...by.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v);
}

export interface PrecautionaryGroup {
  heading: string;
  items: string[];
}

export function buildPrecautionaryFromCorpus(corpus: string[], urlRoots: unknown[]): {
  flatLines: string[];
  grouped: PrecautionaryGroup[];
} {
  const codes = new Set<string>();
  for (const s of corpus) {
    for (const c of extractPCodesFromText(s)) codes.add(c);
    for (const part of s.split(/[,;]+/).map(x => x.trim())) {
      if (/P\d{3}/i.test(part)) extractPCodesFromText(part).forEach(x => codes.add(x));
    }
  }
  for (const r of urlRoots) {
    for (const t of extractPFromUrlsInTree(r)) codes.add(t);
  }

  const sorted = Array.from(codes).sort((a, b) => a.localeCompare(b));
  const flatLines = sorted.map(expandPPhrase);

  const buckets = new Map<string, string[]>();
  for (const token of sorted) {
    const mainCode = token.match(/^(P\d{3})/i)?.[1] ?? token;
    const h = pCategoryHeading(mainCode);
    if (!buckets.has(h)) buckets.set(h, []);
    buckets.get(h)!.push(expandPPhrase(token));
  }

  const order = ["General", "Prevention", "Response", "Storage", "Disposal", "Other"];
  const grouped: PrecautionaryGroup[] = order
    .filter(h => buckets.has(h))
    .map(h => ({ heading: h, items: buckets.get(h)! }));

  return { flatLines, grouped };
}

/** Merge text-derived codes with URL-derived codes from **section roots only** (not whole views). */
export function mergePictogramSources(sectionRoots: unknown[], fromStrings: string[]): string[] {
  const fromUrls: string[] = [];
  for (const root of sectionRoots) fromUrls.push(...extractPictogramCodesFromUrls(root));
  return normalizeGhsPictogramCodes([...fromStrings, ...fromUrls]).sort((a, b) => a.localeCompare(b));
}
