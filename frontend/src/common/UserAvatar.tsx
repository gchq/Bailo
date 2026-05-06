import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import { randomColor } from 'randomcolor'
import { Entity } from 'types/types'

type Luminosity = 'light' | 'dark'

export default function UserAvatar({ entity, luminosity }: { entity: Entity; luminosity?: Luminosity }) {
  function determineFontColour() {
    switch (luminosity) {
      case 'light':
        return 'black'
        break
      case 'dark':
        return 'white'
        break
      default:
        return 'black'
        break
    }
  }

  const color = randomColor({
    seed: entity.id,
    luminosity: luminosity || 'light',
    format: 'hex',
  })

  return (
    <Avatar
      sx={{
        color: determineFontColour(),
        backgroundColor: color,
        height: '25px',
        width: '25px',
        fontSize: '11px',
      }}
      data-test='userAvatar'
    >
      <Typography>{entity.id.charAt(0).toUpperCase()}</Typography>
    </Avatar>
  )
}
