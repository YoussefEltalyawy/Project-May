import { z } from "zod";

// Chemical Identity Schema
export const ChemicalIdentitySchema = z.object({
  name: z.string().default(""),
  iupacName: z.string().default(""),
  cas: z.string().default(""),
  formula: z.string().default(""),
  molecularWeight: z.string().default(""),
  synonyms: z.array(z.string()).default([]),
  inchiKey: z.string().default(""),
});

// GHS Data Schema
export const GHSDataSchema = z.object({
  pictograms: z.array(z.string()).default([]),
  signalWord: z.enum(["Danger", "Warning"]).default("Warning"),
  hazardStatements: z.array(z.string()).default([]),
  precautionaryStatements: z.array(z.string()).default([]),
  precautionaryGrouped: z.array(
    z.object({
      label: z.string(),
      codes: z.array(z.string()),
    })
  ).optional(),
});

// Physical Properties Schema
export const PhysicalPropertiesSchema = z.object({
  appearance: z.string().default(""),
  boilingPoint: z.string().default(""),
  meltingPoint: z.string().default(""),
  flashPoint: z.string().default(""),
  density: z.string().default(""),
  vaporPressure: z.string().default(""),
  solubility: z.string().default(""),
  ph: z.string().default(""),
  odor: z.string().default(""),
  autoIgnition: z.string().default(""),
});

// SDS Section Schema (for text sections)
export const SDSSectionSchema = z.object({
  text: z.array(z.string()).default([]),
});

// Full SDS Data Schema
export const SDSDataSchema = z.object({
  cid: z.string(),
  identity: ChemicalIdentitySchema,
  ghs: GHSDataSchema,
  physical: PhysicalPropertiesSchema,
  hazards: SDSSectionSchema.default({ text: [] }),
  composition: SDSSectionSchema.default({ text: [] }),
  firstAid: SDSSectionSchema.default({ text: [] }),
  fireFighting: SDSSectionSchema.default({ text: [] }),
  accidentalRelease: SDSSectionSchema.default({ text: [] }),
  handling: SDSSectionSchema.default({ text: [] }),
  storage: SDSSectionSchema.default({ text: [] }),
  exposure: SDSSectionSchema.default({ text: [] }),
  stability: SDSSectionSchema.default({ text: [] }),
  toxicology: SDSSectionSchema.default({ text: [] }),
  ecological: SDSSectionSchema.default({ text: [] }),
  disposal: SDSSectionSchema.default({ text: [] }),
  transport: SDSSectionSchema.default({ text: [] }),
  regulatory: SDSSectionSchema.default({ text: [] }),
  otherInfo: SDSSectionSchema.default({ text: [] }),
  arabicWarning: z.string().optional(),
});

// PubChem API Response Schemas
export const PubChemPropertySchema = z.object({
  CID: z.number(),
  MolecularFormula: z.string().optional(),
  MolecularWeight: z.number().optional(),
  IUPACName: z.string().optional(),
  Title: z.string().optional(),
  InChIKey: z.string().optional(),
});

export const PubChemPropertyTableSchema = z.object({
  Properties: z.array(PubChemPropertySchema),
});

export const PubChemPropertyResponseSchema = z.object({
  PropertyTable: PubChemPropertyTableSchema,
});

export const PubChemCIDResponseSchema = z.object({
  IdentifierList: z.object({
    CID: z.array(z.number()),
  }),
});

export const PubChemSynonymsResponseSchema = z.object({
  InformationList: z.object({
    Information: z.array(
      z.object({
        Synonym: z.array(z.string()).optional(),
      })
    ),
  }),
});

export const PubChemAutocompleteResponseSchema = z.object({
  dictionary_terms: z.object({
    compound: z.array(z.string()).optional(),
  }),
});

// Search History Item Schema
export const SearchHistoryItemSchema = z.object({
  id: z.string(),
  term: z.string(),
  cid: z.string(),
  name: z.string(),
  cas: z.string().optional(),
  timestamp: z.number(),
  formula: z.string().optional(),
});

// Export types
export type SDSDataValidated = z.infer<typeof SDSDataSchema>;
export type SearchHistoryItem = z.infer<typeof SearchHistoryItemSchema>;
export type PubChemPropertyResponse = z.infer<typeof PubChemPropertyResponseSchema>;
