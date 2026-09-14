const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const BRIEF_PROMPT = `You write a short, plain-language summary for a patient about a lab value trend. You are NOT a doctor and must NEVER diagnose, predict a disease, or tell the patient what they have.

RULES:
1. NEVER use: "diagnose", "diagnosis", "predict", "you have", "disease", "condition confirmed".
2. Only describe direction and rate of change.
3. Attribute any threshold to its source guideline — never invent your own cutoff.
4. Always end with a neutral suggestion to discuss with a doctor.
5. Under 80 words, plain language.
6. Output ONLY the summary text — no JSON, no markdown.`;

async function generateBrief({ analyteKey, trend, threshold, projection }) {
  const userPrompt = `Analyte: ${analyteKey}
Reports used: ${trend.reportsUploaded}
Slope per year: ${trend.slopePerYear}
Latest value: ${trend.latestValue}
Threshold: ${threshold ? `${threshold.value} (source: ${threshold.source})` : 'none'}
Projection: ${projection ? JSON.stringify(projection) : 'none'}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    messages: [
      { role: 'system', content: BRIEF_PROMPT },
      { role: 'user', content: userPrompt }
    ]
  });

  return completion.choices[0]?.message?.content?.trim();
}

module.exports = { generateBrief };