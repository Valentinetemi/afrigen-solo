const OM_BASE = process.env.OPENMETADATA_URL!
const OM_TOKEN = process.env.OPENMETADATA_TOKEN!

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${OM_TOKEN}`,
}

// Step 1: Create the AfriGen service (only needs to succeed once)
export async function createAfriGenService() {
  try {
    // First check if it already exists
    const check = await fetch(`${OM_BASE}/api/v1/services/databaseServices/name/afrigen-synthetic`, {
      headers,
    })

    if (check.ok) {
      const existing = await check.json()
      console.log('[OpenMetadata] Service already exists:', existing.name)
      return existing
    }

    // Try to create it
    const res = await fetch(`${OM_BASE}/api/v1/services/databaseServices`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'afrigen-synthetic',
        displayName: 'AfriGen Synthetic Data',
        description: 'AI-generated synthetic African datasets grounded in WHO and World Bank statistics.',
        serviceType: 'CustomDatabase',
        connection: {
          config: {
            type: 'CustomDatabase',
            sourcePythonClass: 'afrigen.synthetic',
          },
        },
      }),
    })

    const data = await res.json()
    console.log('[OpenMetadata] Service creation response:', data)
    return data
  } catch (err) {
    console.error('[OpenMetadata] Service creation failed:', err)
    return null
  }
}

// Step 2: Ensure database and schema exist under the service
export async function ensureDatabaseExists() {
  // Create database (ignore if already exists)
  const dbRes = await fetch(`${OM_BASE}/api/v1/databases`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'default',
      displayName: 'AfriGen Default Database',
      service: 'afrigen-synthetic',
    }),
  })
  const db = await dbRes.json()
  console.log('[OpenMetadata] Database:', db.name || db.message)

  // Create schema (ignore if already exists)
  const schemaRes = await fetch(`${OM_BASE}/api/v1/databaseSchemas`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'synthetic_datasets',
      displayName: 'Synthetic Datasets',
      database: 'afrigen-synthetic.default',
    }),
  })
  const schema = await schemaRes.json()
  console.log('[OpenMetadata] Schema:', schema.name || schema.message)
}

// Step 3: Register a generated dataset as a Table entity
export async function registerDataset({
  name,
  domain,
  country,
  rowCount,
  columns,
  fidelityScore,
  prompt,
}: {
  name: string
  domain: string
  country: string
  rowCount: number
  columns: string[]
  fidelityScore: number
  prompt: string
}) {
  try {
    await ensureDatabaseExists()

    const tableName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 64)

    const res = await fetch(`${OM_BASE}/api/v1/tables`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: tableName,
        displayName: name,
        description: `Synthetic ${domain} dataset for ${country}. Generated from prompt: "${prompt}". Grounded in WHO Global Health Observatory and World Bank statistics.`,
        databaseSchema: 'afrigen-synthetic.default.synthetic_datasets',
        columns: columns.map((col) => ({
          name: col.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          dataType: 'VARCHAR',
          dataLength: 256,
          description: `Column: ${col}`,
        })),
        tags: [{ tagFQN: 'Tier.Tier3' }],
        extension: {
          fidelityScore,
          rowCount,
          country,
          domain,
          generatedBy: 'gemini-2.0-flash',
          groundedBy: 'WHO Global Health Observatory + World Bank Open Data',
          afrigenVersion: '1.0.0',
        },
      }),
    })

    const table = await res.json()
    console.log('[OpenMetadata] Table registered:', table.name || table.message)

    // Post lineage after successful table creation
    if (table.id) {
      await postLineage(table.id, domain)
    }

    return table
  } catch (err) {
    console.error('[OpenMetadata] Dataset registration failed:', err)
    return null
  }
}

// Step 4: Post lineage — WHO/World Bank → Gemini Pipeline → Table
async function postLineage(tableId: string, domain: string) {
  try {
    const res = await fetch(`${OM_BASE}/api/v1/lineage`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        edge: {
          fromEntity: {
            type: 'pipeline',
            fqn: 'afrigen-synthetic.gemini-generator',
          },
          toEntity: {
            type: 'table',
            id: tableId,
          },
          lineageDetails: {
            description: `AI-generated using WHO + World Bank statistics for ${domain} domain in Africa. Powered by Gemini.`,
            source: 'Manual',
          },
        },
      }),
    })
    const lineage = await res.json()
    console.log('[OpenMetadata] Lineage posted:', lineage)
    return lineage
  } catch (err) {
    console.error('[OpenMetadata] Lineage failed:', err)
    return null
  }
}

// Step 5: Fetch all registered AfriGen datasets (for display in UI)
export async function getRegisteredDatasets() {
  try {
    const res = await fetch(
      `${OM_BASE}/api/v1/tables?databaseSchema=afrigen-synthetic.default.synthetic_datasets&lim it=25`,
      { headers }
    )
    const data = await res.json()
    return data.data || []
  } catch (err) {
    console.error('[OpenMetadata] Failed to fetch datasets:', err)
    return []
  }
}

// Step 6: Get a single dataset by FQN (for detail view)
export async function getDatasetByName(tableName: string) {
  try {
    const fqn = `afrigen-synthetic.default.synthetic_datasets.${tableName}`
    const res = await fetch(
      `${OM_BASE}/api/v1/tables/name/${encodeURIComponent(fqn)}`,
      { headers }
    )
    const data = await res.json()
    return data
  } catch (err) {
    console.error('[OpenMetadata] Failed to fetch dataset:', err)
    return null
  }
}