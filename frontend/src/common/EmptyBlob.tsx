import { Stack } from '@mui/material'
import Typography from '@mui/material/Typography'
import Image from 'next/legacy/image'

type EmptyBlobProps = {
  text: string
}

export default function EmptyBlob({ text }: EmptyBlobProps) {
  return (
    <Stack spacing={1} alignItems='center'>
      <Image src='/emptyBlob.svg' alt='Empty blob' width={120} height={120} data-test='emptyBlobImage' />
      <Typography sx={{ textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 'md' }} color='text.secondary'>
        {text}
      </Typography>
    </Stack>
  )
}
