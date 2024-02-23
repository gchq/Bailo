import { Box } from '@mui/material'
import { styled } from '@mui/material/styles'
import Image from 'next/image'
import BailoLogo from 'public/favicon-colour-transparent.png'
import { ReactElement } from 'react'

type LoadingProps = {
  size?: number
}

export default function Loading({ size = 80 }: LoadingProps): ReactElement {
  const StyledImage = styled(Image)({
    animation: `nfLoaderSpin infinite 1.5s linear`,
    animationTimingFunction: ' cubic-bezier(.17,.67,.83,.67)',
    transformBox: 'fill-box',

    '@keyframes nfLoaderSpin': {
      from: {
        transform: 'rotate(0deg)',
      },
      to: {
        transform: 'rotate(360deg)',
      },
    },
  })

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <StyledImage
        src={BailoLogo}
        alt='loading spinner'
        width={size}
        height={size}
        className={'rotate linear infinite'}
      />
    </Box>
  )
}
