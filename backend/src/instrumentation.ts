import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { Resource } from '@opentelemetry/resources'
import { logs, NodeSDK } from '@opentelemetry/sdk-node'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

import config from './utils/config.js'

if (config.instrumentation.enabled) {
  if (config.instrumentation.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)
  }
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: `${config.instrumentation.endpoint}/v1/traces`,
      headers: { Authorization: `Bearer ${config.instrumentation.authenticationToken}` },
    }),
    logRecordProcessor: new logs.SimpleLogRecordProcessor(
      new OTLPLogExporter({
        url: `${config.instrumentation.endpoint}/v1/logs`,
        headers: { Authorization: `Bearer ${config.instrumentation.authenticationToken}` },
      }),
    ),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
      }),
    ],
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: `${config.instrumentation.serviceName}`,
    }),
  })

  sdk.start()
}
