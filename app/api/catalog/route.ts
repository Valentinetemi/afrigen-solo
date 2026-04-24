import { NextResponse } from 'next/server'

const OM_BASE = process.env.OPENMETADATA_URL!
const OM_TOKEN = process.env.OPENMETADATA_TOKEN!

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${OM_TOKEN}`,
}

export async function GET() {
  try {
    const res = await fetch(
      `${OM_BASE}/api/v1/tables?databaseSchema=afrigen-synthetic.default.synthetic_datasets&limit=25&include=all`,
      { headers }
    )
    const data = await res.json()
    const tables = data.data || []

    // this is to map OpenMetadata table shape to the dataset interface
    const datasets = tables.map((table: any) => ({
      id: table.id,
      name: table.displayName || table.name,
      description: table.description || '',
      domain: table.extension?.domain || 'General',
      country: table.extension?.country || 'Africa',
      rowCount: table.extension?.rowCount || 0,
      columnCount: table.columns?.length || 0,
      fidelityScore: table.extension?.fidelityScore || 0,
      createdAt: new Date(table.updatedAt).toISOString(),
    }))

    return NextResponse.json({ datasets })
  } catch (err) {
    console.error('[Catalog] Failed to fetch from OpenMetadata:', err)
    return NextResponse.json({ datasets: [] })
  }
}