const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const EXTRACTION_PROMPT = `You are a medical lab report extraction engine. You do NOT interpret, diagnose, or comment — you ONLY copy numbers that are printed in the image.

STRICT RULES:
1. CORE ANALYTES: Extract these ONLY if explicitly printed with a numeric value: Creatinine, BUN, ACR, HbA1c. Put these in the "analytes" array.
2. FORBIDDEN: Do NOT extract any other analytes. Specifically, do NOT extract fasting glucose or random glucose even if they are present on the report.
3. Do NOT hallucinate, guess, or infer any value not clearly printed. If a core analyte is absent, omit it.
4. Copy value, unit, and analyte label EXACTLY as printed — no rounding, no conversion, no renaming.
5. Extract report date in ISO format (YYYY-MM-DD) if visible, else null.
6. Output ONLY valid JSON, no markdown fences, no extra text:
{
  "reportDate": "YYYY-MM-DD" | null,
  "labName": string | null,
  "analytes": [{ "rawLabel": string, "value": number, "unit": string }]
}
If nothing is found, return an empty array for analytes.`;

async function extractValues(fileBuffer, mimeType) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json'
    }
  });

  const result = await model.generateContent([
    EXTRACTION_PROMPT,
    {
      inlineData: {
        mimeType: mimeType,
        data: fileBuffer.toString('base64')
      }
    }
  ]);

  const rawText = result.response.text();
  if (!rawText) throw new Error('Empty response from Gemini');

  try {
    return JSON.parse(rawText);
  } catch (e) {
    throw new Error('Gemini returned non-JSON output: ' + rawText.slice(0, 200));
  }
}

module.exports = { extractValues };