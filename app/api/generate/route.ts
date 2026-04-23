import { streamSyntheticDataGeneration } from '@/lib/services/gemini'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { stream, domain, country, referenceData} = await streamSyntheticDataGeneration(prompt)

    //this is just to store the context in response header so the frontend can use it

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Generate error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to generate synthetic data',
        details: (error as Error).message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
