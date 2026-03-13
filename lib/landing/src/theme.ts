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
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '&:hover': {
            backgroundColor: '#ececec',
          },
        },
      },
    },
  },
})

export default theme
