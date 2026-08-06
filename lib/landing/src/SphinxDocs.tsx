import { useRouter } from 'next/router'

export default function SphinxDocs() {
  const { basePath } = useRouter()

  return (
    <iframe
      title='Python Documentation'
      src={`${basePath}/docs/python/index.html`}
      style={{ width: '100%', border: 'none', flex: 1, minHeight: 0 }}
    />
  )
}
