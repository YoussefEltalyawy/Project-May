import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { SDSData } from '@/lib/pubchem';

export async function POST(request: Request) {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const data: SDSData = await request.json();

    const sectionsToSummarize = {
      composition: data.composition?.text || [],
      firstAid: data.firstAid?.text || [],
      fireFighting: data.fireFighting?.text || [],
      accidentalRelease: data.accidentalRelease?.text || [],
      handling: data.handling?.text || [],
      storage: data.storage?.text || [],
      exposure: data.exposure?.text || [],
      stability: data.stability?.text || [],
      toxicology: data.toxicology?.text || [],
      ecological: data.ecological?.text || [],
      disposal: data.disposal?.text || [],
      transport: data.transport?.text || [],
      regulatory: data.regulatory?.text || [],
      otherInfo: data.otherInfo?.text || [],
    };

    const prompt = `You are an expert Safety Data Sheet (SDS) compiler.
I have extracted raw database text strings from PubChem for various SDS sections of a chemical named "${data.identity.name}".
The extracted text is extremely repetitive, scattered, and bloated.
Your job is to clean, deduplicate, and summarize each section into 1 to 5 highly professional, concise bullet points max.
Do NOT use markdown bolding or asterisks in the bullet points. Just return the array of strings for each section.
Return the summarized text strongly conforming to normal SDS phrasing.
Remove any redundant or overly wordy paragraphs. Remove any random citations like "(EPA, 1998)" or line numbers.

Here is the raw data in JSON form:
${JSON.stringify(sectionsToSummarize, null, 2)}
`;

    // Define the expected output schema
    const responseSchema = {
      type: "object",
      properties: {
        composition: { type: "array", items: { type: "string" } },
        firstAid: { type: "array", items: { type: "string" } },
        fireFighting: { type: "array", items: { type: "string" } },
        accidentalRelease: { type: "array", items: { type: "string" } },
        handling: { type: "array", items: { type: "string" } },
        storage: { type: "array", items: { type: "string" } },
        exposure: { type: "array", items: { type: "string" } },
        stability: { type: "array", items: { type: "string" } },
        toxicology: { type: "array", items: { type: "string" } },
        ecological: { type: "array", items: { type: "string" } },
        disposal: { type: "array", items: { type: "string" } },
        transport: { type: "array", items: { type: "string" } },
        regulatory: { type: "array", items: { type: "string" } },
        otherInfo: { type: "array", items: { type: "string" } },
      },
      required: [
        "composition", "firstAid", "fireFighting", "accidentalRelease", 
        "handling", "storage", "exposure", "stability", 
        "toxicology", "ecological", "disposal", "transport", 
        "regulatory", "otherInfo"
      ],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You strictly output JSON formatting an SDS.",
        responseMimeType: "application/json",
        responseSchema: responseSchema as any,
        temperature: 0.1, // very low for factual reduction
      }
    });

    const outputJson = JSON.parse(response.text || '{}');

    // Merge the AI summarized text arrays back into the data object
    const summarizedData: SDSData = {
      ...data,
      composition: { text: outputJson.composition || [] },
      firstAid: { text: outputJson.firstAid || [] },
      fireFighting: { text: outputJson.fireFighting || [] },
      accidentalRelease: { text: outputJson.accidentalRelease || [] },
      handling: { text: outputJson.handling || [] },
      storage: { text: outputJson.storage || [] },
      exposure: { text: outputJson.exposure || [] },
      stability: { text: outputJson.stability || [] },
      toxicology: { text: outputJson.toxicology || [] },
      ecological: { text: outputJson.ecological || [] },
      disposal: { text: outputJson.disposal || [] },
      transport: { text: outputJson.transport || [] },
      regulatory: { text: outputJson.regulatory || [] },
      otherInfo: { text: outputJson.otherInfo || [] },
    };

    return NextResponse.json(summarizedData);
  } catch (error: any) {
    console.error("Gemini AI API Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to summarize SDS using Gemini AI. Verify your API Key.",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
