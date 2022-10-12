import Add from '@mui/icons-material/Add'
import ArrowDownward from '@mui/icons-material/ArrowDownward'
import ArrowUpward from '@mui/icons-material/ArrowUpward'
import Remove from '@mui/icons-material/Remove'
import Button from '@mui/material/Button'
import { IconButtonProps as MuiIconButtonProps } from '@mui/material/IconButton'
import React from 'react'
import { omit } from 'lodash'

const mappings: any = {
  remove: Remove,
  plus: Add,
  'arrow-up': ArrowUpward,
  'arrow-down': ArrowDownward,
}

type IconButtonProps = MuiIconButtonProps & {
  icon: string
  iconProps?: object
}

function IconButton(props: IconButtonProps) {
  const { icon, ...otherProps } = props
  const IconComp = mappings[icon]
  return (
    <Button
      startIcon={<IconComp />}
      {...omit(otherProps, ['className', 'iconProps'])}
      variant='text'
      color='secondary'
      size='small'
    />
  )
}

export default IconButton
