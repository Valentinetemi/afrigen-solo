const OM_BASE = process.env.OPENMETADATA_URL!
const OM_TOKEN = process.env.OPENMETADATA_TOKEN!

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${OM_TOKEN}`,
}

// This is to create the AfriGen service in OpenMetadata
export async function createAfriGenService() {
  try {
    const res = await fetch(`${OM_BASE}/api/v1/services/databaseServices`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'afrigen-synthetic',
        displayName: 'AfriGen Synthetic Data',
        description: 'AI-generated synthetic African datasets - grounded in WHO and World Bank statistics.',
        serviceType: 'CustomDatabase',
        connection: {
          config: {
            type: 'CustomDatabase',
            sourcePythonClass: 'afrigen.synthetic',
          }
        }
      })
    })
    const data = await res.json()
    return data
  } catch (err) {
    console.error('[OpenMetadata] Service creation failed:', err)
  }
}

// This is to register a generated dataset as a Table Entity
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

    // To make sure database and schema exist
    await ensureDatabaseExists()

    // This is to register the table
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
        description: `Synthetic ${domain} dataset for ${country}. Generated from prompt: "${prompt}"`,
        databaseSchema: 'afrigen-synthetic.default.synthetic_datasets',
        columns: columns.map(col => ({
          name: col,
          dataType: 'VARCHAR',
          description: `Column: ${col}`,
        })),
        tags: [
          { tagFQN: 'Tier.Tier3' },
        ],
        extension: {
          fidelityScore,
          rowCount,
          country,
          domain,
          generatedBy: 'Gemini 2.0 Flash',
          groundedBy: 'WHO Global Health Observatory + World Bank',
        }
      })
    })

    const table = await res.json()

    // post lineage
    if (table.id) {
      await postLineage(table.id, name, domain)
    }

    return table
  } catch (err) {
    console.error('[OpenMetadata] Dataset registration failed:', err)
    return null
  }
}

async function ensureDatabaseExists() {
  // Create database
  await fetch(`${OM_BASE}/api/v1/databases`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'default',
      displayName: 'AfriGen Default Database',
      service: 'afrigen-synthetic',
    })
  })

  // Create schema
  await fetch(`${OM_BASE}/api/v1/databaseSchemas`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'synthetic_datasets',
      displayName: 'Synthetic Datasets',
      database: 'afrigen-synthetic.default',
    })
  })
}

async function postLineage(tableId: string, name: string, domain: string) {
  await fetch(`${OM_BASE}/api/v1/lineage`, {
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
          description: `Generated using WHO + World Bank statistics for ${domain} in Africa`,
          source: 'Manual',
        }
      }
    })
  })
}