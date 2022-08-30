import AddIcon from '@mui/icons-material/Add'
import Button from '@mui/material/Button'
import { AddButtonProps } from '@rjsf/core'
import React from 'react'

const AddButton: React.FC<AddButtonProps> = (props) => {
  const { ...props2 } = props

  return (
    <Button {...props2} color='secondary'>
      <AddIcon /> Add Item
    </Button>
  )
}

export default AddButton
