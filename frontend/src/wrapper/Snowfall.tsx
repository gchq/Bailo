import Box from '@mui/material/Box'
import Portal from '@mui/material/Portal'

const FLAKE_COUNT = 40
export const SNOW_COLOUR_LIGHT = '#1565c0'

export default function Snowfall() {
  return (
    // Portal escapes the top bar's stacking layer so the snow can sit behind the side menu
    <Portal>
      <Box
        aria-hidden
        data-test='snowfall'
        sx={(theme) => ({
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: theme.zIndex.drawer - 1,
          '@keyframes snowfall': {
            from: { transform: 'translateY(-10vh)' },
            to: { transform: 'translateY(110vh)' },
          },
          '@media (prefers-reduced-motion: reduce)': { display: 'none' },
        })}
      >
        {Array.from({ length: FLAKE_COUNT }, (_, index) => (
          <Box
            key={index}
            component='span'
            sx={(theme) => ({
              position: 'absolute',
              top: 0,
              // Deterministic spread so server and client renders match
              left: `${(index * 37) % 100}%`,
              color: 'white',
              opacity: 0.8,
              fontSize: `${0.6 + (index % 5) * 0.2}rem`,
              textShadow: '0 0 2px rgba(0, 0, 0, 0.3)',
              animation: `snowfall ${8 + (index % 7)}s linear ${-((index * 1.3) % 15)}s infinite`,
              // White flakes vanish on the light page, so use a solid blue with at least 3:1 contrast
              ...theme.applyStyles('light', {
                color: SNOW_COLOUR_LIGHT,
                opacity: 1,
                textShadow: 'none',
              }),
            })}
          >
            ❄
          </Box>
        ))}
      </Box>
    </Portal>
  )
}
