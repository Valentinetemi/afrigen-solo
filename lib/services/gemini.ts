import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText, streamText } from 'ai'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
})

const model = google('gemini-flash-latest")

export async function streamSyntheticDataGeneration(prompt: string) {
  const systemPrompt = `You are a synthetic data generation expert specializing in African contexts.
Generate realistic datasets with authentic African names, geographic locations, currencies, and socioeconomic indicators.
Always ensure data reflects real patterns and distributions from the specified region.
Use real Nigerian states, Kenyan counties, Ghanaian regions — never placeholder values like City_1 or Patient_A.
Names must reflect the country culture — Yoruba, Hausa, Igbo, Swahili, Zulu etc.
Return ONLY valid CSV format data with headers in the first row. No explanations, no markdown, no code blocks.
Each row should be on a new line with comma-separated values. Properly escape values containing commas with quotes.`

  return streamText({
    model,
    system: systemPrompt,
    prompt,
    temperature: 0.7,
  })
}

export async function generateAIRecommendation(analysisReport: string): Promise<string> {
  const systemPrompt = `You are a data science expert helping African data scientists understand data quality and model readiness.
Provide a concise, specific, one-paragraph recommendation (2-3 sentences) based on the data quality analysis provided.
Focus on: what's good about this dataset, what needs fixing, and whether it's ready for model training.
Be specific - don't use generic advice.`

  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: `Data Quality Analysis:\n${analysisReport}\n\nProvide a specific recommendation.`,
    temperature: 0.7,
  })

  return text
}