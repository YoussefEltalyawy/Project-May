import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { SDSData, PhysicalProperties } from '@/lib/pubchem';
import Groq from 'groq-sdk';
import { expandGHSCodes } from '@/lib/ghs-codes';

/**
 * Converts Fahrenheit to Celsius
 */
function fToC(fahrenheit: number): number {
  return Math.round(((fahrenheit - 32) * 5 / 9) * 10) / 10;
}

/**
 * Converts all Fahrenheit temperatures in a string to Celsius
 */
function convertToCelsius(text: string): string {
  if (!text) return text;

  let result = text;
  const placeholder = '\x00TEMP\x00';

  const rangePattern = /(-?\d+(?:\.\d+)?)\s*(?:to|-|~|–)\s*(-?\d+(?:\.\d+)?)\s*°?\s*[Ff]\b/g;
  result = result.replace(rangePattern, (match, min, max) => {
    const minC = fToC(parseFloat(min));
    const maxC = fToC(parseFloat(max));
    return `${placeholder}${minC} to ${maxC}${placeholder} °C`;
  });

  const atPattern = /\bat\s+(-?\d+(?:\.\d+)?)\s*°?\s*[Ff]\b/g;
  result = result.replace(atPattern, (match, temp) => {
    const celsius = fToC(parseFloat(temp));
    return `at ${placeholder}${celsius}${placeholder} °C`;
  });

  const tempPattern = /(-?\d+(?:\.\d+)?)\s*°?\s*[Ff]\b/g;
  result = result.replace(tempPattern, (match, temp) => {
    const celsius = fToC(parseFloat(temp));
    return `${placeholder}${celsius}${placeholder} °C`;
  });

  result = result.replace(new RegExp(placeholder, 'g'), '');
  result = result.replace(/\(NTP,?\s*\d{4}\)/g, '');
  result = result.replace(/\(USCG,?\s*\d{4}\)/g, '');
  result = result.replace(/\s+/g, ' ').trim();
  result = result.replace(/\s{2,}/g, ' ');

  return result;
}

/**
 * Converts all physical properties to metric units
 */
function convertPhysicalToMetric(physical: PhysicalProperties): PhysicalProperties {
  return {
    appearance: physical.appearance,
    odor: physical.odor,
    boilingPoint: convertToCelsius(physical.boilingPoint),
    meltingPoint: convertToCelsius(physical.meltingPoint),
    flashPoint: convertToCelsius(physical.flashPoint),
    density: convertToCelsius(physical.density),
    vaporPressure: convertToCelsius(physical.vaporPressure),
    solubility: convertToCelsius(physical.solubility),
    ph: physical.ph,
    autoIgnition: convertToCelsius(physical.autoIgnition),
  };
}

/**
 * Truncates prompt to fit within token limits
 */
function truncatePrompt(prompt: string, maxTokens: number): string {
  const maxChars = Math.floor(maxTokens * 2.0);
  if (prompt.length <= maxChars) return prompt;

  const truncationPoint = prompt.lastIndexOf('\n', maxChars);
  if (truncationPoint > maxChars * 0.6) {
    return prompt.substring(0, truncationPoint) + '\n\n(Note: Some source data truncated to fit free-tier rate limits.)';
  }

  return prompt.substring(0, maxChars) + '\n\n(Note: Some source data truncated to fit free-tier rate limits.)';
}

// ==================== PROVIDER WRAPPERS ====================

async function tryGemini(prompt: string, responseSchema: any): Promise<any> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        systemInstruction: "You strictly output JSON formatting an SDS.",
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.warn("Gemini failed:", (error as Error).message);
    return null;
  }
}

async function tryGroq(prompt: string): Promise<any> {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const freeModels = [
      { id: 'openai/gpt-oss-120b', maxTokens: 4500 }, 
      { id: 'qwen/qwen3-32b', maxTokens: 3500 },
    ];

    for (const model of freeModels) {
      try {
        const truncatedPrompt = truncatePrompt(prompt, model.maxTokens);
        const completion = await groq.chat.completions.create({
          model: model.id,
          messages: [
            { role: 'system', content: 'You are an expert Safety Data Sheet (SDS) compiler. You MUST respond with valid JSON only, no markdown, no explanation.' },
            { role: 'user', content: truncatedPrompt + '\n\nIMPORTANT: Respond with ONLY a valid JSON object. No markdown code blocks, no extra text.' },
          ],
          temperature: 0.1,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        if (content) {
          const cleanedContent = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          return JSON.parse(cleanedContent);
        }
      } catch (modelError) {
        console.warn(`Groq model ${model.id} failed:`, (modelError as Error).message);
        continue;
      }
    }
    return null;
  } catch (error) {
    console.warn("Groq failed:", (error as Error).message);
    return null;
  }
}

async function tryOpenRouter(prompt: string): Promise<any> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const freeModels = [
      'google/gemma-3-27b-it:free',
      'google/gemma-4-31b-it:free',
      'qwen/qwen3-coder:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
    ];

    for (const model of freeModels) {
      try {
        const modelPrompt = truncatePrompt(prompt, 3500);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': siteUrl,
            'X-OpenRouter-Title': 'SDS Summarizer',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'You are an expert Safety Data Sheet (SDS) compiler. You MUST respond with valid JSON only, no markdown, no explanation.' },
              { role: 'user', content: modelPrompt + '\n\nIMPORTANT: Respond with ONLY a valid JSON object. No markdown code blocks, no extra text.' },
            ],
            temperature: 0.1,
            max_tokens: 1500,
          }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const completion = await response.json();
        const content = completion.choices?.[0]?.message?.content;
        if (content) {
          const cleanedContent = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          return JSON.parse(cleanedContent);
        }
      } catch (modelError) {
        console.warn(`OpenRouter model ${model} failed:`, (modelError as Error).message);
        continue;
      }
    }
    return null;
  } catch (error) {
    console.warn("OpenRouter failed:", (error as Error).message);
    return null;
  }
}

// ==================== ENDPOINT ====================

export async function POST(request: Request) {
  try {
    const data: SDSData = await request.json();
    const chemicalName = data.identity.name;

    const sectionsRaw = {
      hazards: (data.hazards?.text || []).map(t => expandGHSCodes(t)),
      composition: (data.composition?.text || []).map(t => expandGHSCodes(t)),
      firstAid: (data.firstAid?.text || []).map(t => expandGHSCodes(t)),
      fireFighting: (data.fireFighting?.text || []).map(t => expandGHSCodes(t)),
      accidentalRelease: (data.accidentalRelease?.text || []).map(t => expandGHSCodes(t)),
      handling: (data.handling?.text || []).map(t => expandGHSCodes(t)),
      storage: (data.storage?.text || []).map(t => expandGHSCodes(t)),
      exposure: (data.exposure?.text || []).map(t => expandGHSCodes(t)),
      stability: (data.stability?.text || []).map(t => expandGHSCodes(t)),
      toxicology: (data.toxicology?.text || []).map(t => expandGHSCodes(t)),
      ecological: (data.ecological?.text || []).map(t => expandGHSCodes(t)),
      disposal: (data.disposal?.text || []).map(t => expandGHSCodes(t)),
      transport: (data.transport?.text || []).map(t => expandGHSCodes(t)),
      regulatory: (data.regulatory?.text || []).map(t => expandGHSCodes(t)),
      otherInfo: (data.otherInfo?.text || []).map(t => expandGHSCodes(t)),
    };

    const physicalMetric = convertPhysicalToMetric({
      appearance: data.physical?.appearance || "",
      boilingPoint: data.physical?.boilingPoint || "",
      meltingPoint: data.physical?.meltingPoint || "",
      flashPoint: data.physical?.flashPoint || "",
      density: data.physical?.density || "",
      vaporPressure: data.physical?.vaporPressure || "",
      solubility: data.physical?.solubility || "",
      ph: data.physical?.ph || "",
      odor: data.physical?.odor || "",
      autoIgnition: data.physical?.autoIgnition || "",
    });

    // Divide sections into logical chunks to stay well within TPM limits
    const chunks = [
      {
        id: "Physical & Hazards",
        input: { physical: physicalMetric, hazards: sectionsRaw.hazards, composition: sectionsRaw.composition },
        schema: {
          physical: {
            type: "object",
            properties: {
              appearance: { type: "string" }, boilingPoint: { type: "string" }, meltingPoint: { type: "string" },
              flashPoint: { type: "string" }, density: { type: "string" }, vaporPressure: { type: "string" },
              solubility: { type: "string" }, ph: { type: "string" }, odor: { type: "string" }, autoIgnition: { type: "string" },
            }
          },
          hazards: { type: "array", items: { type: "string" } },
          composition: { type: "array", items: { type: "string" } },
        }
      },
      {
        id: "Safety Measures",
        input: { firstAid: sectionsRaw.firstAid, fireFighting: sectionsRaw.fireFighting, accidentalRelease: sectionsRaw.accidentalRelease },
        schema: {
          firstAid: { type: "array", items: { type: "string" } },
          fireFighting: { type: "array", items: { type: "string" } },
          accidentalRelease: { type: "array", items: { type: "string" } },
        }
      },
      {
        id: "Handling & Health",
        input: { handling: sectionsRaw.handling, storage: sectionsRaw.storage, exposure: sectionsRaw.exposure },
        schema: {
          handling: { type: "array", items: { type: "string" } },
          storage: { type: "array", items: { type: "string" } },
          exposure: { type: "array", items: { type: "string" } },
        }
      },
      {
        id: "Stability & Toxicology",
        input: { stability: sectionsRaw.stability, toxicology: sectionsRaw.toxicology },
        schema: {
          stability: { type: "array", items: { type: "string" } },
          toxicology: { type: "array", items: { type: "string" } },
        }
      },
      {
        id: "Environment & Final",
        input: { ecological: sectionsRaw.ecological, disposal: sectionsRaw.disposal, transport: sectionsRaw.transport, regulatory: sectionsRaw.regulatory, otherInfo: sectionsRaw.otherInfo },
        schema: {
          ecological: { type: "array", items: { type: "string" } },
          disposal: { type: "array", items: { type: "string" } },
          transport: { type: "array", items: { type: "string" } },
          regulatory: { type: "array", items: { type: "string" } },
          otherInfo: { type: "array", items: { type: "string" } },
        }
      },
      {
        id: "Arabic Section 3 - Hazards",
        input: { hazards: sectionsRaw.hazards.slice(0, 8), signalWord: data.ghs?.signalWord, pictograms: data.ghs?.pictograms },
        schema: {
          arabicWarning: { type: "string" },
        },
        customPrompt: `You are a professional chemical safety translator. Translate Section 3 (Hazards Identification) into ARABIC.

Chemical: "${chemicalName}"
Signal Word: ${data.ghs?.signalWord || "N/A"}
GHS Pictograms: ${JSON.stringify(data.ghs?.pictograms || [])}
Hazards Data: ${JSON.stringify(sectionsRaw.hazards.slice(0, 8))}

TASK:
Translate the hazards information into professional Modern Standard Arabic (MSA) for an SDS document.

STRUCTURE (in Arabic):
1. Start with the signal word translation: "كلمة التحذير: [Danger/Warning in Arabic]"
2. List each hazard as a bullet point in Arabic
3. Use professional chemical safety terminology
4. Keep the same level of detail as the English version

RULES:
- Use formal technical Arabic suitable for official safety documents
- "Danger" = "خطير" or "خطر شديد"
- "Warning" = "تحذير"
- "Flammable" = "قابل للاشتعال"
- "Toxic" = "سام"
- "Corrosive" = "تآكلي / حارق"
- "Carcinogen" = "مسرطن"
- "Mutagen" = "طافر"
- "Reproductive toxicity" = "سمية تكاثرية"
- Return ONLY a JSON object with key "arabicWarning" containing the full Arabic text (3-6 sentences).`
      }
    ];

    const results = await Promise.all(chunks.map(async (chunk) => {
      // Filter out empty arrays to optimize tokens
      const filteredInput: any = {};
      for (const [key, value] of Object.entries(chunk.input)) {
        if (key === 'physical' || (Array.isArray(value) && value.length > 0)) {
          filteredInput[key] = value;
        }
      }

      const prompt = (chunk as any).customPrompt || `You are an expert Safety Data Sheet (SDS) compiler working on a chemical named "${chemicalName}".
Summarize these specific SDS sections. Follow these rules:
- Clean, deduplicate, and summarize into 1-5 professional bullet points per section.
- NEVER leave a section as an empty array. If no data/safe, provide 1 professional bullet point (e.g., 'Not classified', 'Stable').
- Clean all temperature values (already in °C) and metric units (g/cm³, mmHg). Remove noise/citations.
- Return valid JSON strictly matching the schema.

SECTIONS TO PROCESS:
${JSON.stringify(filteredInput, null, 2)}
`;

      const responseSchema = {
        type: "object",
        properties: chunk.schema,
        required: Object.keys(chunk.schema),
      };

      let chunkResult: any = null;
      if (!chunkResult && process.env.GROQ_API_KEY) chunkResult = await tryGroq(prompt);
      if (!chunkResult && process.env.OPENROUTER_API_KEY) chunkResult = await tryOpenRouter(prompt);
      if (!chunkResult && process.env.GEMINI_API_KEY) chunkResult = await tryGemini(prompt, responseSchema);

      return chunkResult || {};
    }));

    // Merge results from all chunks
    const outputJson = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});

    const summarizedData: SDSData = {
      ...data,
      physical: {
        appearance: outputJson.physical?.appearance ?? data.physical?.appearance ?? "No data available",
        boilingPoint: outputJson.physical?.boilingPoint ?? data.physical?.boilingPoint ?? "No data available",
        meltingPoint: outputJson.physical?.meltingPoint ?? data.physical?.meltingPoint ?? "No data available",
        flashPoint: outputJson.physical?.flashPoint ?? data.physical?.flashPoint ?? "No data available",
        density: outputJson.physical?.density ?? data.physical?.density ?? "No data available",
        vaporPressure: outputJson.physical?.vaporPressure ?? data.physical?.vaporPressure ?? "No data available",
        solubility: outputJson.physical?.solubility ?? data.physical?.solubility ?? "No data available",
        ph: outputJson.physical?.ph ?? data.physical?.ph ?? "No data available",
        odor: outputJson.physical?.odor ?? data.physical?.odor ?? "No data available",
        autoIgnition: outputJson.physical?.autoIgnition ?? data.physical?.autoIgnition ?? "No data available",
      },
      hazards: { text: outputJson.hazards?.length ? outputJson.hazards : ["Not classified as hazardous"] },
      composition: { text: outputJson.composition?.length ? outputJson.composition : ["No additional ingredients identified."] },
      firstAid: { text: outputJson.firstAid?.length ? outputJson.firstAid : ["No specific first aid measures required."] },
      fireFighting: { text: outputJson.fireFighting?.length ? outputJson.fireFighting : ["Use extinguishing media appropriate for surrounding fire."] },
      accidentalRelease: { text: outputJson.accidentalRelease?.length ? outputJson.accidentalRelease : ["No special requirements."] },
      handling: { text: outputJson.handling?.length ? outputJson.handling : ["Handle in accordance with good industrial hygiene and safety practice."] },
      storage: { text: outputJson.storage?.length ? outputJson.storage : ["Store in a cool, well-ventilated place."] },
      exposure: { text: outputJson.exposure?.length ? outputJson.exposure : ["Contains no substances with occupational exposure limit values."] },
      stability: { text: outputJson.stability?.length ? outputJson.stability : ["Stable under normal conditions."] },
      toxicology: { text: outputJson.toxicology?.length ? outputJson.toxicology : ["No toxicological data available for this mixture."] },
      ecological: { text: outputJson.ecological?.length ? outputJson.ecological : ["No environmental hazards identified."] },
      disposal: { text: outputJson.disposal?.length ? outputJson.disposal : ["Dispose of in accordance with local regulations."] },
      transport: { text: outputJson.transport?.length ? outputJson.transport : ["Not regulated for transport."] },
      regulatory: { text: outputJson.regulatory?.length ? outputJson.regulatory : ["No additional regulatory information available."] },
      otherInfo: { text: outputJson.otherInfo?.length ? outputJson.otherInfo : ["Created for safety documentation."] },
      arabicWarning: outputJson.arabicWarning || "تحذير: يجب مراجعة تعليمات السلامة الإنجليزية لهذا المنتج بعناية والتعامل معه بحذر.",
    };

    return NextResponse.json(summarizedData);
  } catch (error) {
    console.error("SDS Summarization Error:", error);
    return NextResponse.json(
      { error: "Failed to summarize SDS.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
