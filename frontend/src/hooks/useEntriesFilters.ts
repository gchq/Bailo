import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import { buildEntriesHref, EntriesFilterQuery, filterSelectTypes } from 'utils/metricsUtils'

function readFilter(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : filterSelectTypes.ALL
}

export function useEntriesFilters() {
  const router = useRouter()

  const filters = useMemo<EntriesFilterQuery>(() => {
    const normalise = (value: string | string[] | undefined) => {
      const normalisedValue = readFilter(value)
      return normalisedValue !== filterSelectTypes.ALL ? normalisedValue : undefined
    }
    return {
      organisation: normalise(router.query.organisation),
      state: normalise(router.query.state),
      schemaId: normalise(router.query.schemaId),
      release: normalise(router.query.release),
      accessRequest: normalise(router.query.accessRequest),
      startMonth: typeof router.query.startMonth === 'string' ? router.query.startMonth : undefined,
      endMonth: typeof router.query.endMonth === 'string' ? router.query.endMonth : undefined,
    }
  }, [router.query])

  const setFilters = useCallback(
    (next: Partial<EntriesFilterQuery>) => {
      router.push(buildEntriesHref({ ...filters, ...next }), undefined, { shallow: true })
    },
    [filters, router],
  )

  return { filters, setFilters }
}
