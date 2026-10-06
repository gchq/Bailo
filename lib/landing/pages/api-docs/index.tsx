import dynamic from 'next/dynamic'

import 'swagger-ui-dist/swagger-ui.css'

const SwaggerApi = dynamic(() => import('../../src/SwaggerApi'), { ssr: false })

export default function ApiDocsPage() {
  return <SwaggerApi />
}
