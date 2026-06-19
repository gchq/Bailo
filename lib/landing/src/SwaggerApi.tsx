import { useEffect, useRef } from 'react'

export default function SwaggerApi() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function initSwagger() {
      const { SwaggerUIBundle, SwaggerUIStandalonePreset } = await import('swagger-ui-dist')

      if (containerRef.current) {
        SwaggerUIBundle({
          urls: [
            { url: './docs/swagger-v2.json', name: 'v2.0.0' },
            { url: './docs/swagger-v3.json', name: 'v3.0.0(beta)' },
          ],
          domNode: containerRef.current,
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          plugins: [SwaggerUIBundle.plugins.DownloadUrl],
          layout: 'StandaloneLayout',
          supportedSubmitMethods: [],
        })
      }
    }
    initSwagger()
  }, [])

  return <div ref={containerRef} />
}
