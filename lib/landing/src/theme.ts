import { createTheme } from '@mui/material/styles'
import { red } from '@mui/material/colors'

// Create a theme instance.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#54278e',
    },
    secondary: {
      main: '#d62560',
    },
    error: {
      main: red.A400,
    },
    markdownBorder: {
      main: '#b8b8b8',
    },
    container: {
      main: '#f3f1f1',
    },
  },
})

export default theme
