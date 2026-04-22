"use client";

import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";
import type { SDSData } from "@/lib/pubchem";
import { getPictogramLabel } from "@/lib/ghsMapping";
import { GHS_PICTOGRAMS_B64 } from "@/lib/ghsB64";
import { reorderFormula } from "@/lib/formulaUtils";
import React from "react";
import { Font } from "@react-pdf/renderer";

// Register Cairo font for Arabic support (using local variable font)
Font.register({
  family: "Cairo",
  src: "/fonts/Cairo-VariableFont_slnt,wght.ttf",
});

// Disable hyphenation to prevent textkit layout issues
Font.registerHyphenationCallback((word) => [word]);

const ChemicalFormulaPdf = ({ formula, style }: { formula: string; style?: { fontSize?: number; fontFamily?: string; color?: string } }) => {
  if (!formula) return null;

  // Reorder from Hill notation to conventional notation
  const reordered = reorderFormula(formula);

  const items = [];
  const regex = /([a-zA-Z\]\)])(\d+)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(reordered)) !== null) {
    const precedingText = reordered.slice(lastIndex, match.index + match[1].length);
    if (precedingText) items.push({ text: precedingText, sub: false });
    items.push({ text: match[2], sub: true });
    lastIndex = regex.lastIndex;
  }
  const remainingText = reordered.slice(lastIndex);
  if (remainingText) items.push({ text: remainingText, sub: false });

  const subStyle = { fontSize: (style?.fontSize || 9) * 0.65, color: style?.color };

  return (
    <Text style={style}>
      {items.map((item, i) =>
        item.sub ? (
          <Text key={i} style={subStyle}>{item.text}</Text>
        ) : (
          item.text
        )
      )}
    </Text>
  );
};

const C = {
  text: "#111827",
  muted: "#4b5563",
  line: "#e5e7eb",
  fill: "#f3f4f6",
  white: "#ffffff",
  indigo: "#4f46e5",
  indigoDark: "#3730a3",
  indigoLight: "#eef2ff",
  danger: "#b91c1c",
  warn: "#b45309",
};

const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.text,
    backgroundColor: C.white,
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 0,
  },
  hero: {
    backgroundColor: C.indigo,
    paddingVertical: 20,
    paddingHorizontal: 44,
    marginBottom: 0,
    marginTop: -30,
  },
  heroKicker: {
    fontSize: 8,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  heroMeta: {
    fontSize: 8,
    color: "rgba(255,255,255,0.88)",
    marginTop: 6,
  },
  identityStrip: {
    backgroundColor: C.indigoLight,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    borderBottomStyle: "solid",
    paddingVertical: 10,
    paddingHorizontal: 44,
  },
  identityRow: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  identityBlock: { minWidth: 120 },
  identityLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.indigoDark,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  identityValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.text },
  body: { paddingHorizontal: 44, paddingTop: 18 },
  section: { marginBottom: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: C.indigo,
    borderLeftStyle: "solid",
    paddingLeft: 8,
    paddingVertical: 4,
    marginBottom: 6,
    backgroundColor: C.fill,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.text,
  },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.muted, width: 108, flexShrink: 0 },
  value: { fontSize: 9, flex: 1, color: C.text, lineHeight: 1.3 },
  signalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderStyle: "solid",
    alignSelf: "flex-start",
    borderRadius: 0,
  },
  signalText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  pictogramRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  pictogramBox: { alignItems: "center", width: 58 },
  pictogramImg: { width: 50, height: 50 },
  pictogramLabel: { fontSize: 6.5, color: C.muted, textAlign: "center", marginTop: 2, width: 58 },
  subhead: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.indigoDark,
    marginBottom: 4,
    marginTop: 6,
  },
  groupLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.indigo,
    marginBottom: 3,
    marginTop: 4,
  },
  bullet: { flexDirection: "row", marginBottom: 3, gap: 5 },
  dot: { fontSize: 8, color: C.indigo, lineHeight: 1.35 },
  bulletText: { fontSize: 9, flex: 1, lineHeight: 1.35, color: C.text },
  propGrid: { flexDirection: "row", flexWrap: "wrap" },
  propCell: { width: "30%", marginBottom: 6, marginRight: 10 },
  propLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted, marginBottom: 1 },
  propValue: { fontSize: 9, color: C.text },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: C.line,
    borderTopStyle: "solid",
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: C.muted },
  pageNum: { fontSize: 7, color: C.muted },
  arabicWarningBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
    borderStyle: "solid",
    borderRadius: 6,
  },
  arabicWarningTitle: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#9f1239",
    textAlign: "right",
    marginBottom: 4,
  },
  arabicWarningText: {
    fontFamily: "Cairo",
    fontSize: 10,
    color: "#4c0519",
    textAlign: "right",
    lineHeight: 1.4,
  },
});

const SectionHeader = ({ num, title }: { num: string; title: string }) => (
  <View style={S.sectionHeader}>
    <Text style={S.sectionTitle}>{`Section ${num}: ${title}`}</Text>
  </View>
);

const BulletItem = ({ text }: { text: string }) => (
  <View style={S.bullet}>
    <Text style={S.dot}>•</Text>
    <Text style={S.bulletText}>{text}</Text>
  </View>
);

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) =>
  value ? (
    <View style={S.row}>
      <Text style={S.label}>{label}</Text>
      {typeof value === "string" || typeof value === "number" ? (
        <Text style={S.value}>{value}</Text>
      ) : (
        <View style={S.value}>{value}</View>
      )}
    </View>
  ) : null;

/** Renders nothing when there is no content (no “not found” copy). */
const TextBlock = ({ items }: { items: string[] }) => {
  if (!items || !Array.isArray(items) || items.length === 0) return null;
  // Limit to 40 items per section to prevent memory issues with massive SDS data
  const limitedItems = items.slice(0, 40).filter(item => item && typeof item === 'string');
  return (
    <>
      {limitedItems.map((t, i) => (
        <BulletItem key={`bullet-${i}`} text={String(t)} />
      ))}
    </>
  );
};

export const SDSTemplate = ({ data }: { data: SDSData }) => {
  const signalColor = data.ghs.signalWord === "Danger" ? C.danger : C.warn;

  const physProps = [
    { label: "Appearance", value: data.physical?.appearance },
    { label: "Odor", value: data.physical?.odor },
    { label: "Boiling point", value: data.physical?.boilingPoint },
    { label: "Melting point", value: data.physical?.meltingPoint },
    { label: "Flash point", value: data.physical?.flashPoint },
    { label: "Density", value: data.physical?.density },
    { label: "Vapor pressure", value: data.physical?.vaporPressure },
    { label: "Solubility", value: data.physical?.solubility },
    { label: "pH", value: data.physical?.ph },
    { label: "Auto-ignition temp.", value: data.physical?.autoIgnition },
  ].filter(p => p.value);

  const prepared = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.hero}>
          <Text style={S.heroKicker}>Safety data sheet · summary</Text>
          <Text style={S.heroTitle}>{data.identity.name}</Text>
          <Text style={S.heroMeta}>
            {prepared}
            {data.identity.cas ? ` · CAS ${data.identity.cas}` : ""}
            {` · Ref. CID ${data.cid}`}
          </Text>
          <Text style={[S.heroKicker, { marginTop: 6 }]}>
            Prepared by Chemist Maysa Ahmed
          </Text>
        </View>

        <View style={S.identityStrip}>
          <View style={S.identityRow}>
            <View style={S.identityBlock}>
              <Text style={S.identityLabel}>Signal</Text>
              <Text style={S.identityValue}>{data.ghs.signalWord}</Text>
            </View>
            {data.identity.formula ? (
              <View style={S.identityBlock}>
                <Text style={S.identityLabel}>Formula</Text>
                <ChemicalFormulaPdf formula={data.identity.formula} style={S.identityValue} />
              </View>
            ) : null}
            {data.identity.molecularWeight ? (
              <View style={S.identityBlock}>
                <Text style={S.identityLabel}>Mol. weight</Text>
                <Text style={S.identityValue}>{data.identity.molecularWeight}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={S.body}>
          <View style={S.section}>
            <SectionHeader num="1" title="Identification" />
            <InfoRow label="Product name" value={data.identity.name} />
            <InfoRow label="IUPAC name" value={data.identity.iupacName} />
            <InfoRow label="Formula" value={<ChemicalFormulaPdf formula={data.identity.formula} style={S.value} />} />
            <InfoRow label="Molecular weight" value={data.identity.molecularWeight} />
            {data.identity.synonyms.length > 0 ? (
              <InfoRow label="Synonyms" value={data.identity.synonyms.join("; ")} />
            ) : null}
          </View>

          <View style={S.section}>
            <SectionHeader num="2" title="Physical & Chemical Properties" />
            {physProps.length > 0 ? (
              <View style={S.propGrid}>
                {physProps.map(({ label, value }) => (
                  <View key={label} style={S.propCell}>
                    <Text style={S.propLabel}>{label}</Text>
                    <Text style={S.propValue}>{value}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={S.section}>
            <SectionHeader num="3" title="Hazards Identification" />
            <View style={[
              S.signalRow,
              {
                backgroundColor: data.ghs.signalWord === "Danger" ? "#fecaca" : "#fed7aa",
                borderColor: signalColor,
              }
            ]}>
              <Text style={[S.signalText, { color: signalColor }]}>
                Signal word: {data.ghs.signalWord}
              </Text>
            </View>

            {Array.isArray(data.ghs?.pictograms) && data.ghs.pictograms.length > 0 ? (
              <View style={S.pictogramRow}>
                {data.ghs.pictograms.map((code) => {
                  if (!code) return null;
                  const src = GHS_PICTOGRAMS_B64[code];
                  if (!src) return null;
                  return (
                    <View key={`pict-${code}`} style={S.pictogramBox}>
                      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
                      <Image src={src} style={S.pictogramImg} />
                      <Text style={S.pictogramLabel}>{getPictogramLabel(code)}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <TextBlock items={data.hazards?.text ?? []} />
          </View>

          <View style={S.section}>
            <SectionHeader num="4" title="First Aid Measure" />
            <TextBlock items={data.firstAid?.text ?? []} />
          </View>

          <View style={S.section}>
            <SectionHeader num="5" title="Firefight Measure" />
            <TextBlock items={data.fireFighting?.text ?? []} />
          </View>

          <View style={S.section}>
            <SectionHeader num="6" title="Handling and Storage" />
            <TextBlock items={[...(data.handling?.text ?? []), ...(data.storage?.text ?? [])]} />
          </View>

          <View style={S.section}>
            <SectionHeader num="7" title="Exposure Controls / Personal Protection" />
            <TextBlock items={data.exposure?.text ?? []} />
          </View>

          <View style={S.section}>
            <SectionHeader num="8" title="Ecological Information" />
            <TextBlock items={data.ecological?.text ?? []} />
          </View>

          <View style={S.section}>
            <SectionHeader num="9" title="Disposal Considerations" />
            <TextBlock items={data.disposal?.text ?? []} />
          </View>

          <View style={S.section}>
            <SectionHeader num="10" title="Toxicological Info" />
            <TextBlock items={data.toxicology?.text ?? []} />
          </View>

          {data.arabicWarning && String(data.arabicWarning).trim() ? (
            <View style={S.arabicWarningBox}>
              <Text style={S.arabicWarningTitle}>تحذير سلامة (Safety Warning)</Text>
              <Text style={S.arabicWarningText}>{String(data.arabicWarning)}</Text>
            </View>
          ) : null}
        </View>

        <View style={S.footer} fixed>
          <Text style={S.footerText}>Summary for reference · confirm details with your supplier SDS</Text>
          <Text
            style={S.pageNum}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};
