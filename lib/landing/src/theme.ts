import { createTheme } from '@mui/material/styles'
import { red } from '@mui/material/colors'

// Create a theme instance.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4d3075',
    },
    secondary: {
      main: '#b5497d',
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
