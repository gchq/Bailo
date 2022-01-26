import Card from '@mui/material/Card'
import { useGetUiConfig } from '../data/uiConfig'

const Banner = () => {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const style = {
    pt: 0.5,
    pb: 0.5,
    textAlign: 'center',
    backgroundColor: uiConfig?.banner?.colour || 'black',
    color: 'white',
    borderRadius: 0,
    position: 'fixed',
    width: 1,
    zIndex: 1500,
  }

  if (isUiConfigError) {
    // @ts-ignore
    return <Card sx={style}>Unable to load uiConfig</Card>
  }

  return (
    <>
      {!isUiConfigLoading && uiConfig?.banner?.enable ? (
        // @ts-ignore
        <Card sx={style}>{uiConfig?.banner?.text}</Card>
      ) : (
        <> </>
      )}
    </>
  )
}

export default Banner
