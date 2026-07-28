import { Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Image from 'next/image'
import { CSSProperties } from 'react'

type EmptyBlobProps = {
  text: string
  style?: CSSProperties
}

export default function EmptyBlob({ text, style }: EmptyBlobProps) {
  const theme = useTheme()

  const blobToDisplay = () => {
    if (theme.palette.mode === 'light') {
      return <Image src='/emptyBlob.svg' alt='Empty blob' width={120} height={120} data-test='emptyBlobImage' />
    } else {
      return <Image src='/emptyBlobDark.svg' alt='Empty blob' width={120} height={120} data-test='emptyBlobImage' />
    }
  }
  return (
    <Stack
      spacing={1}
      style={style}
      sx={{
        alignItems: 'center',
      }}
    >
      {blobToDisplay()}
      <Typography
        sx={{
          color: 'text.secondary',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          maxWidth: '100%',
          textAlign: 'center',
        }}
      >
        {text}
      </Typography>
    </Stack>
  )
}
