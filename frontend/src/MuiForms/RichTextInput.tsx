import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useRef } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'

interface RichTextInputProps {
  value: string
  onChange: (newValue: string) => void
  label?: string
  formContext?: any
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  id: string
  rawErrors?: string[]
}

export default function RichTextInput({
  label,
  value,
  formContext,
  onChange,
  required,
  disabled,
  id,
  rawErrors,
}: RichTextInputProps) {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.addEventListener('click', (event) => {
      if (ref.current) {
        const questionComponent = event.composedPath().includes(ref.current)
        if (ref.current && questionComponent) {
          formContext.onClickListener(id)
        }
      }
    })
  }, [formContext])

  if (!formContext.editMode) {
    return (
      <div ref={ref}>
        <Typography fontWeight='bold'>{label}</Typography>
        {value ? (
          <MarkdownDisplay>{value}</MarkdownDisplay>
        ) : (
          !formContext.hideInputs && (
            <Typography
              sx={{
                fontStyle: 'italic',
                color: theme.palette.customTextInput.main,
              }}
            >
              Unanswered
            </Typography>
          )
        )}
      </div>
    )
  }

  return (
    <div ref={ref}>
      <RichTextEditor
        value={value}
        onChange={onChange}
        textareaProps={{ disabled, id }}
        errors={rawErrors}
        label={
          <Typography fontWeight='bold'>
            {label}
            {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
          </Typography>
        }
        key={label}
      />
    </div>
  )
}
