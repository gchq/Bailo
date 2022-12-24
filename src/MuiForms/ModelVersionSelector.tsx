import React, { ReactElement, useEffect, useMemo } from 'react'
import { WidgetProps } from '@rjsf/core'
import { useRouter } from 'next/router'
import SelectWidget from '@/src/MuiForms/SelectWidget'
import { useGetModelVersions } from '@/data/model'
import useNotification from '@/src/common/Snackbar'

export default function ModelVersionSelector({
  value: currentValue,
  options: currentOptions,
  ...rest
}: WidgetProps): ReactElement {
  const sendNotification = useNotification()
  const router = useRouter()
  const { uuid: modelUuid }: { uuid?: string; selectedVersion?: string } = router.query
  const { versions, isVersionsLoading, isVersionsError } = useGetModelVersions(modelUuid)

  useEffect(() => {
    if (isVersionsError) sendNotification({ variant: 'error', msg: `Failed to get versions for model ${modelUuid}` })
  }, [isVersionsError, modelUuid, sendNotification])

  const value = useMemo(() => {
    if (currentValue) return currentValue
    return ''
  }, [currentValue])

  const options = useMemo(() => {
    if (isVersionsLoading || isVersionsError || !versions) return currentOptions

    return {
      ...currentOptions,
      enumOptions: versions.map((version) => ({
        value: version.version,
        label: version.version,
      })),
    }
  }, [versions, isVersionsLoading, isVersionsError, currentOptions])

  return <SelectWidget value={value} options={options} {...rest} />
}
