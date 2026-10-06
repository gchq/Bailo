import { Box } from '@mui/material'
import { styled } from '@mui/material/styles'
import { ReactElement } from 'react'

const StyledBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  left: '-9999px',
  width: '10px',
  height: '10px',
  borderRadius: '5px',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.secondary.main,
  boxShadow: '9999px 0 0 -5px',
  animation: 'dot-pulse 1.5s infinite linear',
  animationDelay: '0.25s',

  '&:before, &:after': {
    content: '""',
    display: 'inline-block',
    position: 'absolute',
    top: 0,
    width: '10px',
    height: '10px',
    borderRadius: '5px',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.secondary.dark,
  },

  '&:before': {
    boxShadow: '9984px 0 0 -5px',
    animation: 'dot-pulse-before 1.5s infinite linear',
    animationDelay: '0s',
  },

  '&:after': {
    boxShadow: '10014px 0 0 -5px',
    animation: 'dot-pulse-after 1.5s infinite linear',
    animationDelay: '0.5s',
  },

  '@keyframes dot-pulse': {
    '0%': {
      boxShadow: '9999px 0 0 -5px',
    },
    '30%': {
      boxShadow: '9999px 0 0 2px',
    },
    '60%, 100%': {
      boxShadow: '9999px 0 0 -5px',
    },
  },

  '@keyframes dot-pulse-before': {
    '0%': {
      boxShadow: '9984px 0 0 -5px',
    },
    '30%': {
      boxShadow: '9984px 0 0 2px',
    },
    '60%, 100%': {
      boxShadow: '9984px 0 0 -5px',
    },
  },

  '@keyframes dot-pulse-after': {
    '0%': {
      boxShadow: '10014px 0 0 -5px',
    },
    '30%': {
      boxShadow: '10014px 0 0 2px',
    },
    '60%, 100%': {
      boxShadow: '10014px 0 0 -5px',
    },
  },
}))

export default function Loading(): ReactElement {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <StyledBox />
    </Box>
  )
}
