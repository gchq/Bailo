import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import dynamic from 'next/dynamic'
import { ReactNode, useState } from 'react'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

export type RichTextEditorProps = {
  onDataValueChange: (value: string) => void
  dataValue: string
  ariaLabel: string
  label?: ReactNode
}

export default function RichTextEditor({ onDataValueChange, dataValue, ariaLabel, label }: RichTextEditorProps) {
  const [hideToolbar, setHideToolbar] = useState(true)

  const toggleToolbar = () => {
    setHideToolbar(!hideToolbar)
  }

  const handleChange = (value?: string) => {
    onDataValueChange(value || '')
  }

  return (
    <>
      <Box display='flex'>
        {label}
        <Button size='small' onClick={toggleToolbar} sx={{ ml: 'auto' }}>
          {`${hideToolbar ? 'Show' : 'Hide'} Toolbar`}
        </Button>
      </Box>
      <MDEditor
        defaultTabEnable
        preview='edit'
        hideToolbar={hideToolbar}
        value={dataValue}
        onChange={handleChange}
        textareaProps={{ 'aria-label': ariaLabel }}
      />
    </>
  )
}
