import 'swagger-ui-react/swagger-ui.css'

import Box from '@mui/material/Box'
import dynamic from 'next/dynamic'
import React from 'react'
import Title from 'src/common/Title'

const SwaggerUI = dynamic(import('swagger-ui-react'), { ssr: false })

export default function API() {
  return (
    <>
      <Title text='API' />
      <Box sx={{ backgroundColor: '#f5f5f5', pt: '5px', pb: '5px', borderRadius: 4 }}>
        <SwaggerUI url='/api/v2/specification' />
      </Box>
    </>
  )
}
