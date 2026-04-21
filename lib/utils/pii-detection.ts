export function isPIIColumn(columnName: string): boolean {
  const columnLower = columnName.toLowerCase()

  const piiPatterns = [
    /patient_?name|full_?name|name|firstname|lastname|surname/,
    /phone|mobile|telephone|contact/,
    /email|mail|email_?address/,
    /ssn|social_?security|national_?id|id_?number|passport|driving_?license/,
    /address|street|city|zip|postal/,
    /credit_?card|card_?number|account_?number|bank_?account/,
    /date_?of_?birth|dob|age|birth_?date/,
    /salary|income|wage|compensation/,
    /health_?id|medical_?record|diagnosis|prescription/,
    /mother_?name|father_?name|family|relative/,
  ]

  return piiPatterns.some((pattern) => pattern.test(columnLower))
}

export function detectPIIColumns(headers: string[]): string[] {
  return headers.filter((header) => isPIIColumn(header))
}

export function calculatePIIPenalty(piiColumnsCount: number, totalColumns: number): number {
  if (piiColumnsCount === 0) return 0
  // Penalty: 5 points per PII column, max 30 points
  return Math.min((piiColumnsCount / totalColumns) * 40, 30)
}
