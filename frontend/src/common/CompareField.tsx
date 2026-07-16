import { SxProps } from '@mui/material/styles'
import { ReactNode } from 'react'
import InlineDiff from 'src/common/InlineDiff'
import { CompareFieldState } from 'src/hooks/useCompareField'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'

interface CompareFieldProps {
  id: string
  label?: string
  required?: boolean
  description?: string
  compare: CompareFieldState<unknown>
  value: unknown
  formatter?: (val: unknown) => string | undefined
  markdown?: boolean
  hasValue?: boolean
  fallbackMirroredContent?: ReactNode
  sx?: SxProps
  children: ReactNode
}

export default function CompareField({
  id,
  label,
  required,
  description,
  compare,
  value,
  formatter,
  markdown,
  hasValue,
  fallbackMirroredContent,
  sx,
  children,
}: CompareFieldProps) {
  const format = (val: unknown): string | undefined => {
    if (formatter) {
      return formatter(val)
    }
    return val as string | undefined
  }

  if (compare.inCompareMode && !compare.isMirroredModel) {
    const from = compare.compareFromState ?? compare.mirroredState
    return (
      <AdditionalInformation
        editMode={false}
        display={false}
        label={label}
        id={id}
        required={required}
        mirroredModel={false}
        description={description}
      >
        <InlineDiff from={format(from)} to={format(value)} markdown={markdown} />
      </AdditionalInformation>
    )
  }

  const mirroredContent = compare.inMirroredCompare ? (
    <InlineDiff
      from={format(compare.compareFromMirroredState)}
      to={format(compare.mirroredState)}
      markdown={markdown}
    />
  ) : (
    (fallbackMirroredContent ?? compare.mirroredState)
  )

  const effectiveHasValue = hasValue ?? !!value
  const display = compare.inMirroredCompare ? true : effectiveHasValue

  return (
    <AdditionalInformation
      editMode={compare.editMode}
      mirroredState={mirroredContent}
      display={display && compare.isMirroredModel}
      label={label}
      id={id}
      required={required}
      mirroredModel={compare.isMirroredModel}
      description={description}
      sx={sx}
    >
      {children}
    </AdditionalInformation>
  )
}
