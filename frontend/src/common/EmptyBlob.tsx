import { Stack } from '@mui/material'
import Typography from '@mui/material/Typography'
import Image from "next/image"

type EmptyBlobProps = {
  text: string
}

export default function EmptyBlob({ text }: EmptyBlobProps) {
  return (
    (<Stack spacing={1} alignItems='center'>
      <Image
        src='/emptyBlob.svg'
        alt='Empty blob'
        width={120}
        height={120}
        data-test='emptyBlobImage'
        style={{
          maxWidth: "100%",
          height: "auto"
        }} />
      <Typography color='text.secondary'>{text}</Typography>
    </Stack>)
  );
}
