import { useEffect, useState } from 'react'

export default function useIsMac(): boolean {
  const [isMac, setIsMac] = useState(false)
  useEffect(() => {
    if (navigator !== undefined) {
      setIsMac(navigator.platform.startsWith('Mac') || navigator.platform === 'iPhone')
    }
  }, [])
  return isMac
}
