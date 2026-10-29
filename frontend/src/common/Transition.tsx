import { Slide } from '@mui/material'
import { type TransitionProps } from '@mui/material/transitions'
import { forwardRef, type ReactElement, type Ref } from 'react'

export const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement
  },
  ref: Ref<unknown>,
) {
  return <Slide direction='up' ref={ref} {...props} />
})
