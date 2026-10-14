import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material/styles'
import { MDEditorProps } from '@uiw/react-md-editor'
import dynamic from 'next/dynamic'
import { ReactNode, useState } from 'react'
import { limitText, TEXT_INPUT_MAX_LENGTH } from 'utils/inputLimits'

// The MD Editor library uses custom CSS property names which do not correspond to standard CSS naming
interface MDEditorStyling {
  [Key: string]: string
}

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

export type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  label?: ReactNode
  textareaProps?: MDEditorProps['textareaProps']
  dataTest?: string
  errors?: string[]
  alwaysShowToolbar?: boolean
  maxLength?: number
}

export default function RichTextEditor({
  value,
  onChange,
  textareaProps,
  label = <></>,
  dataTest = 'richTextEditor',
  errors,
  alwaysShowToolbar = false,
  maxLength = TEXT_INPUT_MAX_LENGTH,
}: RichTextEditorProps) {
  const [hideToolbar, setHideToolbar] = useState(true)
  const theme = useTheme()

  const toggleToolbar = () => {
    setHideToolbar(!hideToolbar)
  }

  const handleChange = (newValue?: string) => {
    onChange(limitText(newValue || '', maxLength, value))
  }

  const richTextareaProps = {
    'data-test': dataTest,
    ...textareaProps,
    maxLength,
  }

  const styling: MDEditorStyling = {
    '--color-border-default': errors && errors.length > 0 ? theme.palette.error.main : '',
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          overflow: 'auto',
        }}
      >
        {label}
        {!alwaysShowToolbar && (
          <Button size='small' onClick={toggleToolbar} sx={{ ml: 'auto' }}>
            {`${hideToolbar ? 'Show' : 'Hide'} Toolbar`}
          </Button>
        )}
      </Box>
      <MDEditor
        defaultTabEnable
        value={value}
        style={styling}
        preview='edit'
        hideToolbar={alwaysShowToolbar ? false : hideToolbar}
        height={150}
        textareaProps={{ ...richTextareaProps, 'aria-label': 'rich-text-input' }}
        onChange={handleChange}
      />
    </>
  )
}
