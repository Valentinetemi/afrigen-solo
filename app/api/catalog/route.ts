import { getCatalog, addDataset } from '@/lib/services/dataset-store'

export async function GET() {
  try {
    const datasets = getCatalog()

    return Response.json({
      datasets: datasets.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        domain: d.domain,
        country: d.country,
        rowCount: d.rowCount,
        columnCount: d.columnCount,
        fidelityScore: d.fidelityScore,
        createdAt: d.createdAt,
      })),
    })
  } catch (error) {
    console.error('[v0] Catalog GET error:', error)
    return Response.json({ error: 'Failed to fetch catalog' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { csvData, name, domain, country } = await req.json()

    if (!csvData || !name || !domain || !country) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const dataset = addDataset(csvData, name, domain, country)

    return Response.json({ dataset })
  } catch (error) {
    console.error('[v0] Catalog POST error:', error)
    return Response.json({ error: 'Failed to add dataset' }, { status: 500 })
  }
}
