import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

import { commands } from '@uiw/react-md-editor'
import dynamic from 'next/dynamic'
import React from 'react'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

export type MarkdownEditorProps = {
  setDataValue: (string) => void
  dataValue: string
}

export default function MarkdownEditor({ dataValue, setDataValue }: MarkdownEditorProps) {
  return (
    <div className='container'>
      <MDEditor value={dataValue} onChange={setDataValue} />
    </div>
  )
}

interface MarkdownProps {
  markdownContent: any
  setMarkdownContent: (value: string) => void
  title: string
  helperText: string
  viewMode?: boolean
}

function Editor({ markdownContent, setMarkdownContent, title, helperText, viewMode }: MarkdownProps) {
  return <></>
}
