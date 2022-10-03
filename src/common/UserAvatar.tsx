import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import { randomColor } from 'randomcolor'
import { useEffect, useState } from 'react'

export default function UserAvatar({
  username,
  size,
  luminosity,
}: {
  username: string
  size?: UserAvatarSizes
  luminosity?: Luminosity
}) {
  const [avatarSize, setAvatarSize] = useState<string>()
  const [fontSize, setFontSize] = useState<number>()
  const [fontColour, setFontColour] = useState<string>()

  const color = randomColor({
    seed: username,
    luminosity: luminosity || 'light',
    format: 'hex',
  })

  useEffect(() => {
    switch (size) {
      case 'chip':
        setAvatarSize('30px')
        setFontSize(13)
        break
      default:
        break
    }

    switch (luminosity) {
      case 'light':
        setFontColour('black')
        break
      case 'dark':
        setFontColour('white')
        break
      default:
        setFontColour('black')
        break
    }
  }, [size, luminosity])

  return (
    <Avatar
      sx={{
        color: fontColour,
        backgroundColor: color,
        height: avatarSize,
        width: avatarSize,
        fontSize,
      }}
    >
      <Typography>{username.charAt(0).toUpperCase()}</Typography>
    </Avatar>
  )
}

type UserAvatarSizes = 'chip'
type Luminosity = 'light' | 'dark'
