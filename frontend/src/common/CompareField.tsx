import { SxProps } from '@mui/material/styles'
import { ReactNode } from 'react'
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

  const renderDiff = (from: unknown, to: unknown) =>
    markdown ? (
      <InlineMarkdownDiff from={format(from)} to={format(to)} />
    ) : (
      <InlineTypographyDiff from={format(from)} to={format(to)} />
    )

  if (compare.inCompareMode && !compare.isMirroredModel) {
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
        {renderDiff(compare.compareFromState ?? compare.mirroredState, value)}
      </AdditionalInformation>
    )
  }

  if (compare.inMirroredCompare) {
    // Diff both the original (mirrored) answer and the locally added additional information. The additional
    // information is shown if either version has a value, so that removed information is still visible.
    const hasAdditionalInformation = !!format(compare.compareFromState) || !!format(value)

    return (
      <AdditionalInformation
        editMode={false}
        mirroredState={renderDiff(compare.compareFromMirroredState, compare.mirroredState)}
        display
        label={label}
        id={id}
        required={required}
        mirroredModel
        description={description}
        sx={sx}
      >
        {hasAdditionalInformation && renderDiff(compare.compareFromState, value)}
      </AdditionalInformation>
    )
  }

  const mirroredContent = fallbackMirroredContent ?? compare.mirroredState
  const display = hasValue ?? !!value

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
