import dynamic from 'next/dynamic'

const SphinxDocs = dynamic(() => import('../src/SphinxDocs'), { ssr: false })

export default function PythonDocsPage() {
  return <SphinxDocs />
}
