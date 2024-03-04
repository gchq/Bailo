import { registerOTel } from '@vercel/otel'

export async function register() {
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT && process.env.OTEL_EXPORTER_OTLP_HEADERS) {
    registerOTel({
      serviceName: 'frontend',
    })
  }
}
