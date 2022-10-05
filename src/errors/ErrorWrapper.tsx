import Alert from '@mui/material/Alert'
import Wrapper from '../Wrapper'

export default function ErrorWrapper({ message }: { message?: string }) {
  return (
    <Wrapper title='Error' page='error'>
      <Alert severity='error'>{message || 'Unable to communicate with server.'}</Alert>
    </Wrapper>
  )
}

export function MinimalErrorWrapper({ message }: { message?: string }) {
  return <Alert severity='error'>{message || 'Unable to communicate with server.'}</Alert>
}
