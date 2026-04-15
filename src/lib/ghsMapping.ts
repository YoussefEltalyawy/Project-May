// SVG URLs for browser display (img tags handle SVGs fine)
export const GHS_PICTOGRAMS_SVG: Record<string, string> = {
  GHS01: "https://upload.wikimedia.org/wikipedia/commons/4/4b/GHS-pictogram-explos.svg",
  GHS02: "https://upload.wikimedia.org/wikipedia/commons/6/6d/GHS-pictogram-flamme.svg",
  GHS03: "https://upload.wikimedia.org/wikipedia/commons/a/a6/GHS-pictogram-rondflam.svg",
  GHS04: "https://upload.wikimedia.org/wikipedia/commons/7/77/GHS-pictogram-bottle.svg",
  GHS05: "https://upload.wikimedia.org/wikipedia/commons/c/c3/GHS-pictogram-acid.svg",
  GHS06: "https://upload.wikimedia.org/wikipedia/commons/b/b5/GHS-pictogram-skull.svg",
  GHS07: "https://upload.wikimedia.org/wikipedia/commons/c/c5/GHS-pictogram-exclam.svg",
  GHS08: "https://upload.wikimedia.org/wikipedia/commons/b/b3/GHS-pictogram-silhouete.svg",
  GHS09: "https://upload.wikimedia.org/wikipedia/commons/1/1a/GHS-pictogram-pollu.svg",
};

// PNG thumbnail URLs for @react-pdf/renderer (SVG is not supported as img src in react-pdf)
export const GHS_PICTOGRAMS_PNG: Record<string, string> = {
  GHS01: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/GHS-pictogram-explos.svg/200px-GHS-pictogram-explos.svg.png",
  GHS02: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/GHS-pictogram-flamme.svg/200px-GHS-pictogram-flamme.svg.png",
  GHS03: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/GHS-pictogram-rondflam.svg/200px-GHS-pictogram-rondflam.svg.png",
  GHS04: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/GHS-pictogram-bottle.svg/200px-GHS-pictogram-bottle.svg.png",
  GHS05: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/GHS-pictogram-acid.svg/200px-GHS-pictogram-acid.svg.png",
  GHS06: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/GHS-pictogram-skull.svg/200px-GHS-pictogram-skull.svg.png",
  GHS07: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/GHS-pictogram-exclam.svg/200px-GHS-pictogram-exclam.svg.png",
  GHS08: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/GHS-pictogram-silhouete.svg/200px-GHS-pictogram-silhouete.svg.png",
  GHS09: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/GHS-pictogram-pollu.svg/200px-GHS-pictogram-pollu.svg.png",
};

// GHS label descriptions
export const GHS_LABELS: Record<string, string> = {
  GHS01: "Explosive",
  GHS02: "Flammable",
  GHS03: "Oxidizer",
  GHS04: "Compressed Gas",
  GHS05: "Corrosive",
  GHS06: "Toxic",
  GHS07: "Irritant",
  GHS08: "Health Hazard",
  GHS09: "Environmental",
};

export const getPictogramUrl = (code: string): string | null => GHS_PICTOGRAMS_SVG[code] || null;
export const getPictogramPngUrl = (code: string): string | null => GHS_PICTOGRAMS_PNG[code] || null;
export const getPictogramLabel = (code: string): string => GHS_LABELS[code] || code;

/** Normalize PubChem / free-text fragments to canonical GHS01–GHS09. */
export function normalizeGhsPictogramCode(raw: string): string | null {
  const t = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (/^GHS0[1-9]$/.test(t)) return t;
  const m = t.match(/^GHS([1-9])$/);
  if (m) return `GHS0${m[1]}`;
  return null;
}

/** Dedupe ordered list of normalized pictogram codes. */
export function normalizeGhsPictogramCodes(codes: Iterable<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of codes) {
    const n = normalizeGhsPictogramCode(c);
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

/** Same-origin proxy path (use with absolute origin in browser / PDF). */
export function getPictogramProxyPath(code: string): string {
  return `/api/pictogram/${encodeURIComponent(code)}`;
}

export function getPictogramProxyUrl(origin: string, code: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${getPictogramProxyPath(code)}`;
}
