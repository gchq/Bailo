import 'swagger-ui-react/swagger-ui.css'
import dynamic from 'next/dynamic'
import Wrapper from 'src/Wrapper'
import Box from '@mui/material/Box'

const SwaggerUI = dynamic(import('swagger-ui-react'), { ssr: false })

export default function API() {
  return (
    <Wrapper title='API Documentation' page='api'>
      <Box sx={{ backgroundColor: '#f5f5f5', pt: '5px', pb: '5px', borderRadius: 4 }}>
        <SwaggerUI url='/api/v1/specification' />
      </Box>
    </Wrapper>
  )
}
