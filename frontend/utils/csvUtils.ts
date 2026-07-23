/** Leading characters that spreadsheet apps may interpret as formula triggers. */
const dangerousPrefixes = /^[=+\-@\t\r]/

/** Characters that require RFC 4180 quoting within a CSV field. */
const csvSpecialCharacters = /[",\r\n]/

/**
 * Escapes a single CSV field. Wraps the value in quotes (and doubles any
 * embedded quotes) if it contains a comma, quote, or newline.
 */
function escapeCsvField(value: string): string {
  const safeValue = dangerousPrefixes.test(value) ? `'${value}` : value

  if (csvSpecialCharacters.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`
  }
  return safeValue
}

/**
 * Converts headers + rows of string values into a CSV formatted string.
 */
export function toCsvString(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((line) => line.map(escapeCsvField).join(','))
  return lines.join('\r\n')
}

/**
 * Builds a CSV file from headers + rows and triggers a browser download.
 */
export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csvContent = toCsvString(headers, rows)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
