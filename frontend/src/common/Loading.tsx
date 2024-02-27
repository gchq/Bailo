import { Box } from '@mui/material'
import { styled } from '@mui/material/styles'
import { ReactElement } from 'react'

export default function Loading(): ReactElement {
  const StyledBox = styled(Box)({
    position: 'relative',
    left: '-9999px',
    width: '10px',
    height: '10px',
    borderRadius: '5px',
    backgroundColor: '#9880ff',
    color: ' #d62560',
    boxShadow: '9999px 0 0 -5px',
    animation: 'dot-pulse 1.5s infinite linear',
    animationDelay: '0.25s',
    borderColor: 'red',

    '&:before, &:after': {
      content: '""',
      display: 'inline-block',
      position: 'absolute',
      top: 0,
      width: '10px',
      height: '10px',
      borderRadius: '5px',
      backgroundColor: '#9880ff',
      color: ' #54278e',
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
  })

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <StyledBox />
    </Box>
  )
}
