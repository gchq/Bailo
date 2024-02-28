import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { Resource } from '@opentelemetry/resources'
import { logs, NodeSDK } from '@opentelemetry/sdk-node'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

import config from './src/utils/config.js'

if (config.instrumentation.enabled) {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: `${config.instrumentation.tracesEndpoint}/v1/traces`,
      headers: { Authorization: `Bearer ${config.instrumentation.tracesAuthenticationToken}` },
    }),
    logRecordProcessor: new logs.SimpleLogRecordProcessor(
      new OTLPLogExporter({
        url: `${config.instrumentation.tracesEndpoint}/v1/logs`,
        headers: { Authorization: `Bearer ${config.instrumentation.tracesAuthenticationToken}` },
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
