import { useEffect, useState } from 'react'

export default function useCacheVariable<T>(variable: T): T | undefined {
  const [cache, setCache] = useState<T | undefined>(undefined)

  useEffect(() => {
    setCache((old) => {
      if (old !== undefined) return old
      return variable
    })
  }, [variable])

  return cache
}
