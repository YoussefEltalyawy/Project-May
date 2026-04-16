import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { SDSData } from '@/lib/pubchem';
import Groq from 'groq-sdk';

export async function POST(request: Request) {
  try {
    const data: SDSData = await request.json();

    const sectionsToSummarize = {
      hazards: data.hazards?.text || [],
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
        hazards: { type: "array", items: { type: "string" } },
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
        "hazards", "composition", "firstAid", "fireFighting", "accidentalRelease", 
        "handling", "storage", "exposure", "stability", 
        "toxicology", "ecological", "disposal", "transport", 
        "regulatory", "otherInfo"
      ],
    };

    // Try AI providers in order: Gemini → Groq → OpenRouter → Raw Data
    let outputJson: any = null;

    // 1. Try Gemini first
    if (!outputJson && process.env.GEMINI_API_KEY) {
      outputJson = await tryGemini(prompt, responseSchema);
    }

    // 2. Fallback to Groq (FREE TIER)
    if (!outputJson && process.env.GROQ_API_KEY) {
      outputJson = await tryGroq(prompt);
    }

    // 3. Fallback to OpenRouter (FREE MODELS)
    if (!outputJson && process.env.OPENROUTER_API_KEY) {
      outputJson = await tryOpenRouter(prompt);
    }

    if (!outputJson) {
      console.warn("All AI providers failed, returning raw data");
      return NextResponse.json(data);
    }

    // Merge the AI summarized text arrays back into the data object
    const summarizedData: SDSData = {
      ...data,
      hazards: { text: outputJson.hazards || [] },
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
    console.error("AI Summarization Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to summarize SDS using AI providers. Verify your API Keys.",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

// ==================== PROVIDER HELPER FUNCTIONS ====================

async function tryGemini(prompt: string, responseSchema: any): Promise<any> {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: "You strictly output JSON formatting an SDS.",
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error: any) {
    console.warn("Gemini failed:", error?.message);
    return null;
  }
}

async function tryGroq(prompt: string): Promise<any> {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // Free models on Groq (in order of preference)
    const freeModels = [
      'llama-3.3-70b-versatile',  // Best free model
      'gpt-oss-120b',             // OpenAI OSS model
      'llama-3.1-8b-instant',     // Fast fallback
      'gpt-oss-20b',              // Smaller OSS model
    ];

    for (const model of freeModels) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert Safety Data Sheet (SDS) compiler. You MUST respond with valid JSON only, no markdown, no explanation.',
            },
            {
              role: 'user',
              content: prompt + '\n\nIMPORTANT: Respond with ONLY a valid JSON object. No markdown code blocks, no extra text.',
            },
          ],
          temperature: 0.1,
          max_tokens: 4096,
          response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          console.log(`Groq model ${model} succeeded`);
          return parsed;
        }
      } catch (modelError: any) {
        console.warn(`Groq model ${model} failed:`, modelError?.message);
        continue;
      }
    }

    return null;
  } catch (error: any) {
    console.warn("Groq failed:", error?.message);
    return null;
  }
}

async function tryOpenRouter(prompt: string): Promise<any> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

    // Free models on OpenRouter (in order of preference)
    const freeModels = [
      'meta-llama/llama-3.3-70b-instruct:free',  // Meta's Llama 3.3 70B
      'openai/gpt-oss-120b:free',                // OpenAI OSS 120B
      'openrouter/elephant-alpha:free',          // Elephant Alpha 100B
      'z-ai/glm-4.5-air:free',                   // GLM 4.5 Air
    ];

    for (const model of freeModels) {
      try {
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
              {
                role: 'system',
                content: 'You are an expert Safety Data Sheet (SDS) compiler. You MUST respond with valid JSON only, no markdown, no explanation.',
              },
              {
                role: 'user',
                content: prompt + '\n\nIMPORTANT: Respond with ONLY a valid JSON object. No markdown code blocks, no extra text.',
              },
            ],
            temperature: 0.1,
            max_tokens: 4096,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const completion = await response.json();
        const content = completion.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          console.log(`OpenRouter model ${model} succeeded`);
          return parsed;
        }
      } catch (modelError: any) {
        console.warn(`OpenRouter model ${model} failed:`, modelError?.message);
        continue;
      }
    }

    return null;
  } catch (error: any) {
    console.warn("OpenRouter failed:", error?.message);
    return null;
  }
}
