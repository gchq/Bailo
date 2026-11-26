import Box from '@mui/material/Box'

// Pale green keeps at least 3:1 contrast across the top bar's purple-pink gradient and dark mode
const WIRE_COLOUR = '#c8e6c9'
const BULB_COLOURS = ['#e53935', '#43a047', '#fdd835', '#1e88e5']
// shortcut: fixed count covers screens up to 2400px wide, raise it if wider displays need it
const BULB_COUNT = 60

export type ChristmasLightsProps = {
  twinkle: boolean
}

export default function ChristmasLights({ twinkle }: ChristmasLightsProps) {
  return (
    <Box
      aria-hidden
      data-test='christmasLights'
      data-twinkle={twinkle}
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -12,
        height: 24,
        display: 'flex',
        overflow: 'hidden',
        pointerEvents: 'none',
        '@keyframes twinkle': {
          '50%': { opacity: 0.3 },
        },
      }}
    >
      {Array.from({ length: BULB_COUNT }, (_, index) => {
        const colour = BULB_COLOURS[index % BULB_COLOURS.length]
        return (
          <Box
            key={index}
            component='svg'
            viewBox='0 0 40 24'
            sx={{
              flex: '0 0 40px',
              height: 24,
              '& .bulb': {
                animation: twinkle ? `twinkle 1.5s ease-in-out ${(index % 4) * 0.375}s infinite` : 'none',
              },
              '@media (prefers-reduced-motion: reduce)': {
                '& .bulb': { animation: 'none' },
              },
            }}
          >
            {/* Wire swags between bulbs so the lights weave along the bottom edge of the bar */}
            <path d='M0 2 Q20 14 40 2' fill='none' stroke={WIRE_COLOUR} strokeWidth='2' />
            <rect x='18' y='7' width='4' height='3' fill={WIRE_COLOUR} />
            <ellipse
              className='bulb'
              cx='20'
              cy='15'
              rx='4'
              ry='6'
              fill={colour}
              // Dark outline keeps pale bulbs (e.g. yellow) visible where they hang over the light page
              stroke='rgba(0, 0, 0, 0.7)'
              strokeWidth='1'
              style={{ filter: `drop-shadow(0 0 3px ${colour})` }}
            />
          </Box>
        )
      })}
    </Box>
  )
}
