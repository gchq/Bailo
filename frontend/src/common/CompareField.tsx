import { SxProps } from '@mui/material/styles'
import { ReactNode } from 'react'
import InlineDiff from 'src/common/InlineDiff'
import InlineMarkdownDiff from 'src/common/InlineDiff/InlineMarkdownDiff'
import InlineTypographyDiff from 'src/common/InlineDiff/InlineTypographyDiff'
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
    // RJSF passes numbers and integers through TextWidget, so values are not guaranteed to be strings
    if (val === undefined || val === null || val === '') {
      return undefined
    }
    return String(val)
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
        {markdown ? (
          <InlineMarkdownDiff from={format(from)} to={format(value)} />
        ) : (
          <InlineTypographyDiff from={format(from)} to={format(value)} />
        )}
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
