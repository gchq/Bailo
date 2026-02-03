import ScanModel, { ModelScanSummary, ScanSummary, SeverityLevelKeys } from '../models/Scan.js'

export async function up() {
  await ScanModel.updateMany({ summary: { $exists: false }, viruses: { $exists: true } }, [
    {
      $set: {
        summary: '$viruses',
      },
    },
    {
      $unset: ['viruses', 'isInfected'],
    },
  ])

  const modelScans = await ScanModel.find({
    toolName: 'testScanner',
  })

  for (const scan of modelScans) {
    const newSummary: ScanSummary = []
    const scanSummary = scan.get('summary') as any[]
    if (scanSummary && scanSummary.length > 0) {
      for (const summaryBefore of scanSummary) {
        if (typeof summaryBefore === 'string') {
          const colonIndex = summaryBefore.indexOf(':')
          if (colonIndex === -1) {
            continue
          }
          const severityPart = summaryBefore.slice(0, colonIndex).trim().toLowerCase() as SeverityLevelKeys
          const vulnerabilityPart = summaryBefore.slice(colonIndex + 1).trim()
          newSummary.push({ severity: severityPart, vulnerabilityDescription: vulnerabilityPart } as ModelScanSummary)
        }
      }
      scan.set('summary', newSummary)
      await scan.save()
    }
  }
}

export async function down() {
  /* NOOP */
}
