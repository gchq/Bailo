import { Typography } from '@mui/material'
import { ReactNode } from 'react'

type CodeSnippetProps = {
  children: ReactNode
}
export default function CodeSnippetBox({ children }: CodeSnippetProps) {
  return (
    <Typography
      sx={{
        whiteSpace: 'pre-wrap',
        border: '1px solid',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        overflowX: 'auto',
        width: '100%',
        maxWidth: 'md',
        position: 'relative',
      }}
    >
      {children}
    </Typography>
  )
}
