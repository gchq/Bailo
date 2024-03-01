import { Grid, Stack } from '@mui/material'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useContext, useMemo } from 'react'
import ThemeModeContext from 'src/contexts/themeModeContext'
import { ThemeKey, themeList } from 'src/theme'

export default function DisplayTab() {
  const { setTheme } = useContext(ThemeModeContext)

  const themes = useMemo(() => {
    return themeList.map((theme) => (
      <Grid item key={theme.key}>
        <ExampleDisplay theme={theme} setTheme={setTheme} />
      </Grid>
    ))
  }, [setTheme])

  return (
    <Stack sx={{ px: 2, py: 4 }}>
      <Typography fontWeight='bold'>Theme</Typography>
      <Grid container spacing={2}>
        {themes}
      </Grid>
    </Stack>
  )
}

interface ExampleDisplayProps {
  theme: ThemeKey
  setTheme: (newTheme: string) => void
}
function ExampleDisplay({ theme, setTheme }: ExampleDisplayProps) {
  return <Button onClick={() => setTheme(theme.key)}>{theme.key}</Button>
}
