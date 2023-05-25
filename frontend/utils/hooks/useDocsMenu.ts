import axios, { AxiosResponse } from 'axios'
import { useCallback, useEffect, useState } from 'react'

import { DocsMenuContent } from '../../types/types'

export type DocsMenuHook = {
  docsMenuContent: DocsMenuContent
  errorMessage?: string
}

export default function useDocsMenu(): DocsMenuHook {
  const [docsMenuContent, setDocsMetadata] = useState<DocsMenuContent>([])
  const [errorMessage, setErrorMessage] = useState('')

  const getDocsMenu = useCallback(async (): Promise<void> => {
    try {
      const response: AxiosResponse<DocsMenuContent> = await axios({
        method: 'get',
        url: '/api/v1/docs/menu-content',
        headers: { 'Content-Type': 'application/json' },
      })
      setDocsMetadata(response.data)
    } catch (error) {
      setErrorMessage('Failed to fetch documentation')
    }
  }, [])

  useEffect(() => {
    getDocsMenu()
  }, [getDocsMenu])

  return { docsMenuContent, errorMessage }
}
