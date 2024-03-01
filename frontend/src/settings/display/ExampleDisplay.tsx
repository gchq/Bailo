import { Box, Button } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { ThemeKey } from 'src/theme'

interface ExampleDisplayProps {
  theme: ThemeKey
  setTheme: (newTheme: string) => void
}
export default function ExampleDisplay({ theme, setTheme }: ExampleDisplayProps) {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ border: 'solid 1px', backgroundColor: theme.theme.palette.container.main }}>
        <Button sx={{ color: theme.theme.palette.primary.main, width: '100%' }} onClick={() => setTheme(theme.key)}>
          {theme.key}
        </Button>
      </Box>
    </ThemeProvider>
  )
}
