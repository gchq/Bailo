import { Alert, AlertTitle } from '@mui/material'
import Card from '@mui/material/Card'
import { useGetUiConfig } from 'actions/uiConfig'

export default function Announcement() {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  if (isUiConfigLoading || !uiConfig?.banner?.enabled) {
    return null
  }

  return (
    <Alert severity='info'>
      <AlertTitle>Info</AlertTitle>
      This is an info Alert with an informative title.
    </Alert>
  )
}
