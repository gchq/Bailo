import 'swagger-ui-react/swagger-ui.css'
import dynamic from 'next/dynamic'
import Wrapper from 'src/Wrapper'

const SwaggerUI = dynamic(import('swagger-ui-react'), { ssr: false })

export default function API() {
  return (
    <Wrapper title='API Documentation' page='api'>
      <SwaggerUI url='/api/v1/specification' />
    </Wrapper>
  )
}
