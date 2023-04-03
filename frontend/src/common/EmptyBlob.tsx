import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Image from 'next/legacy/image'
import React from 'react'

export default function EmptyBlob({ text }: { text: string }) {
  return (
    <Box
      sx={{
        margin: 'auto',
        marginTop: 3,
        paddingBottom: 3,
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <Typography sx={{ mb: 1.5, display: 'flex', justifyContent: 'center' }} color='text.secondary'>
        {text}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Image src='/emptyBlob.svg' alt='Empty blob' width={120} height={120} />
      </Box>
    </Box>
  )
}
