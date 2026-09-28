import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { scrollToElementId } from 'utils/scrollUtils'

/**
 * Scrolls to the element named by the URL hash, e.g. `#root_name-question`. Covers deep links, where the page is
 * rendered after the browser has already tried to follow the anchor.
 */
export default function useScrollToHash() {
  const router = useRouter()
  const hash = router.asPath.split('#')[1] || ''

  useEffect(() => {
    if (hash) {
      scrollToElementId(hash)
    }
  }, [hash])
}
