import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ParsedData {
  rows: any[]
  headers: string[]
  detectedDomain: string
}

export async function parseFile(file: File): Promise<ParsedData> {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension === 'csv') {
    return parseCSV(file)
  } else if (extension === 'json') {
    return parseJSON(file)
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file)
  } else if (extension === 'parquet') {
    return parseParquet(file)
  }

  throw new Error(`Unsupported file format: ${extension}`)
}

function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          reject(new Error('CSV file is empty'))
          return
        }

        const headers = Object.keys(results.data[0] as Record<string, unknown>)
        const domain = detectDomain(headers)

        resolve({
          rows: results.data as any[],
          headers,
          detectedDomain: domain,
        })
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`))
      },
    })
  })
}

function parseJSON(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        if (!Array.isArray(data)) {
          reject(new Error('JSON must be an array of objects'))
          return
        }

        if (data.length === 0) {
          reject(new Error('JSON array is empty'))
          return
        }

        const headers = Object.keys(data[0])
        const domain = detectDomain(headers)

        resolve({
          rows: data,
          headers,
          detectedDomain: domain,
        })
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${(error as Error).message}`))
      }
    }
    reader.readAsText(file)
  })
}

function parseExcel(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer
        const workbook = XLSX.read(new Uint8Array(data), { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(worksheet) as any[]

        if (rows.length === 0) {
          reject(new Error('Excel file is empty'))
          return
        }

        const headers = Object.keys(rows[0])
        const domain = detectDomain(headers)

        resolve({
          rows,
          headers,
          detectedDomain: domain,
        })
      } catch (error) {
        reject(new Error(`Failed to parse Excel: ${(error as Error).message}`))
      }
    }
    reader.readAsArrayBuffer(file)
  })
}

async function parseParquet(file: File): Promise<ParsedData> {
  try {
    const buffer = await file.arrayBuffer()
    // For now, throw an error since parquet-wasm requires complex setup
    throw new Error('Parquet support coming soon. Please use CSV, JSON, or Excel.')
  } catch (error) {
    throw new Error(`Failed to parse Parquet: ${(error as Error).message}`)
  }
}

function detectDomain(headers: string[]): string {
  const headersLower = headers.map((h) => h.toLowerCase())

  // Healthcare
  if (
    headersLower.some((h) =>
      /patient|disease|malaria|symptom|diagnosis|medical|health|hospital/.test(h)
    )
  ) {
    return 'Healthcare'
  }

  // Finance/FinTech
  if (
    headersLower.some((h) =>
      /transaction|payment|mobile_money|account|balance|transfer|loan/.test(h)
    )
  ) {
    return 'FinTech'
  }

  // Agriculture
  if (
    headersLower.some((h) =>
      /crop|yield|harvest|farm|agriculture|soil|weather|irrigation/.test(h)
    )
  ) {
    return 'Agriculture'
  }

  // Education
  if (
    headersLower.some((h) =>
      /student|grade|school|education|exam|course|university/.test(h)
    )
  ) {
    return 'Education'
  }

  // Energy
  if (
    headersLower.some((h) => /energy|electricity|power|fuel|solar|renewable/.test(h))
  ) {
    return 'Energy'
  }

  // Labor/Employment
  if (
    headersLower.some((h) =>
      /employment|job|skill|wage|income|labor|unemployment/.test(h)
    )
  ) {
    return 'Labor'
  }

  return 'General'
}
