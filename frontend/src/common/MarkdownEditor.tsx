import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

import ShowIcon from '@mui/icons-material/Visibility'
import HideIcon from '@mui/icons-material/VisibilityOff'
import { codeEdit, codeLive, codePreview, divider, fullscreen, group } from '@uiw/react-md-editor/lib/commands'
import dynamic from 'next/dynamic'
import { useCallback, useMemo, useState } from 'react'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

export type MarkdownEditorProps = {
  onDataValueChange: (value: string) => void
  dataValue: string
}

export default function MarkdownEditor({ onDataValueChange, dataValue }: MarkdownEditorProps) {
  const [showToolbar, setShowToolbar] = useState(false)

  const toggleToolbar = useCallback(() => {
    setShowToolbar(!showToolbar)
  }, [showToolbar])

  const extraCommands = useMemo(
    () =>
      showToolbar
        ? [
            divider,
            codeEdit,
            codeLive,
            codePreview,
            fullscreen,
            group([], {
              name: 'Hide Toolbar',
              icon: <HideIcon sx={{ fontSize: '12px' }} />,
              groupName: 'hideToolbar',
              buttonProps: {
                'aria-label': 'Hide toolbar',
              },
              execute: toggleToolbar,
            }),
          ]
        : [
            fullscreen,
            group([], {
              name: 'Show Toolbar',
              icon: <ShowIcon sx={{ fontSize: '12px' }} />,
              groupName: 'showToolbar',
              buttonProps: {
                'aria-label': 'Show toolbar',
              },
              execute: toggleToolbar,
            }),
          ],
    [showToolbar, toggleToolbar]
  )

  const handleChange = (value?: string) => {
    onDataValueChange(value || '')
  }

  return (
    <MDEditor
      defaultTabEnable
      commands={showToolbar ? undefined : []}
      extraCommands={extraCommands}
      value={dataValue}
      onChange={handleChange}
    />
  )
}
