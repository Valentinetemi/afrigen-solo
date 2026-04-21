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

    const result = await streamSyntheticDataGeneration(prompt)

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[v0] Generate error:', error)
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
