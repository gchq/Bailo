import 'swagger-ui-react/swagger-ui.css'
import dynamic from 'next/dynamic'
import Wrapper from 'src/Wrapper'

const SwaggerUI = dynamic(import('swagger-ui-react'), { ssr: false })

export default function API({ handleDarkModeToggle }: { handleDarkModeToggle: any }) {
  return (
    <Wrapper title='API Documentation' page='api' handleDarkModeToggle={handleDarkModeToggle}>
      <SwaggerUI url='/api/v1/specification' />
    </Wrapper>
  )
}
