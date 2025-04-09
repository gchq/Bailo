import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { HostMetrics } from '@opentelemetry/host-metrics'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { logs, NodeSDK } from '@opentelemetry/sdk-node'
import os from 'os'

import { ATTR_SERVICE_NAME, ATTRS_HOST_NAME } from './semconv.js'
import config from './utils/config.js'

if (config.instrumentation.enabled) {
  if (config.instrumentation.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)
  }
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: `${config.instrumentation.serviceName}`,
    [ATTRS_HOST_NAME]: `${os.hostname}`,
  })
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
    resource,
  })
  sdk.start()

  const metricExporter = new OTLPMetricExporter({
    url: `${config.instrumentation.endpoint}/v1/metrics`,
    headers: {
      Authorization: `Bearer ${config.instrumentation.authenticationToken}`,
    },
  })
  const meterProvider = new MeterProvider({
    resource,
    readers: [
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
      }),
    ],
  })
  const hostMetrics = new HostMetrics({ meterProvider })
  hostMetrics.start()
}
