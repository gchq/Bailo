import { useEffect, useState } from 'react'

export default function useCacheVariable<T>(variable: T): T | undefined {
  const [cache, setCache] = useState<T | undefined>(undefined)

  useEffect(() => {
    if (cache !== undefined) return
    setCache(variable)
  }, [variable, cache])

  return cache
}
