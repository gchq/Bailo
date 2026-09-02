import Avatar from '@mui/material/Avatar'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { randomColor } from 'randomcolor'
import { Entity } from 'types/types'

type Luminosity = 'light' | 'dark'

export default function UserAvatar({
  entity,
  luminosity,
  highlight = false,
}: {
  entity: Entity
  luminosity?: Luminosity
  highlight?: boolean
}) {
  const theme = useTheme()
  const fontColour = luminosity === 'dark' ? 'white' : 'black'

  const color = randomColor({
    seed: entity.id,
    luminosity: luminosity || theme.palette.mode,
    format: 'hex',
  })

  return (
    <Avatar
      sx={{
        color: fontColour,
        backgroundColor: color,
        height: '25px',
        width: '25px',
        fontSize: '11px',
        ...(highlight && {
          border: '2px solid',
          borderColor: theme.palette.secondary.main,
        }),
      }}
      // Border is visual only difference, so name it for a11y
      aria-label={highlight ? `${entity.id} (you)` : undefined}
      data-test='userAvatar'
    >
      <Typography>{entity.id.charAt(0).toUpperCase()}</Typography>
    </Avatar>
  )
}
