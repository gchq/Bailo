import Card from '@mui/material/Card'
import { useGetUiConfig } from 'actions/uiConfig'

export default function Banner() {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const style = {
    pt: 0.5,
    pb: 0.5,
    textAlign: 'center',
    backgroundColor: uiConfig?.banner?.colour || 'black',
    color: uiConfig?.banner?.textColor ? uiConfig?.banner?.textColor : 'white',
    borderRadius: 0,
    position: 'fixed',
    width: 1,
    zIndex: 1299,
  }

  if (isUiConfigError) {
    return <Card sx={style}>Unable to load UI config</Card>
  }

  if (isUiConfigLoading || !uiConfig?.banner?.enabled) {
    return null
  }

  return <Card sx={style}>{uiConfig.banner.text}</Card>
}
