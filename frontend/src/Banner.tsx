import { Typography } from '@mui/material'
import Card from '@mui/material/Card'
import { useContext } from 'react'
import UiConfigContext from 'src/contexts/uiConfigContext'

export default function Banner() {
  const uiConfig = useContext(UiConfigContext)

  const style = {
    pt: 0.5,
    pb: 0.5,
    textAlign: 'center',
    backgroundColor: uiConfig.banner?.colour || 'black',
    color: uiConfig.banner?.textColor ? uiConfig.banner?.textColor : 'white',
    borderRadius: 0,
    position: 'fixed',
    width: 1,
    zIndex: 1299,
  }

  return (
    <Card sx={style} aria-hidden='true'>
      <Typography>{uiConfig.banner.text}</Typography>
    </Card>
  )
}
