import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import { randomColor } from 'randomcolor'
import React, { useEffect, useEffectEvent, useState } from 'react'
import { Entity } from 'types/types'

export default function UserAvatar({
  entity,
  size,
  luminosity,
}: {
  entity: Entity
  size?: UserAvatarSizes
  luminosity?: Luminosity
}) {
  const [avatarSize, setAvatarSize] = useState<string>()
  const [fontSize, setFontSize] = useState<number>()
  const [fontColour, setFontColour] = useState<string>()

  const color = randomColor({
    seed: entity.id,
    luminosity: luminosity || 'light',
    format: 'hex',
  })

  const onAvatarSizeChange = useEffectEvent((updatedSize: string) => {
    setAvatarSize(updatedSize)
  })

  const onFontSizeChange = useEffectEvent((updatedSize: number) => {
    setFontSize(updatedSize)
  })

  const onFontColourChange = useEffectEvent((updatedFontColour: string) => {
    setFontColour(updatedFontColour)
  })

  useEffect(() => {
    switch (size) {
      case 'chip':
        onAvatarSizeChange('25px')
        onFontSizeChange(11)
        break
      default:
        break
    }

    switch (luminosity) {
      case 'light':
        onFontColourChange('black')
        break
      case 'dark':
        onFontColourChange('white')
        break
      default:
        onFontColourChange('black')
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
      data-test='userAvatar'
    >
      <Typography>{entity.id.charAt(0).toUpperCase()}</Typography>
    </Avatar>
  )
}

type UserAvatarSizes = 'chip'
type Luminosity = 'light' | 'dark'
