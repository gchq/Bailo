import { Stack } from '@mui/material'
import Typography from '@mui/material/Typography'
import Image from 'next/image'
import { CSSProperties } from 'react'

type EmptyBlobProps = {
  text: string
  style?: CSSProperties
}

export default function EmptyBlob({ text, style }: EmptyBlobProps) {
  return (
    <Stack spacing={1} alignItems='center' style={style}>
      <Image src='/emptyBlob.svg' alt='Empty blob' width={120} height={120} data-test='emptyBlobImage' />
      <Typography
        sx={{
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          maxWidth: '100%',
          textAlign: 'center',
        }}
        color='text.secondary'
      >
        {text}
      </Typography>
    </Stack>
  )
}
