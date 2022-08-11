import { createTheme } from '@mui/material/styles'
import { green, red, yellow } from '@mui/material/colors'

export interface Theme {
  palette: {
    primary: {
      main: string
    }
    secondary: {
      main: string
    }
    error: {
      main: string
    }
  }
}

// Create a theme instance.
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#27598e',
    },
    secondary: {
      main: '#f37f58',
    },
    error: {
      main: red.A400,
    },
  },
})

// Create a theme instance.
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6a6a6a',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f37f58',
    },
    error: {
      main: red.A200,
    },
    warning: {
      main: yellow.A700,
    },
    success: {
      main: green.A700,
    },
    background: {
      paper: '#242424',
    },
    action: {
      active: '#fff',
      hover: '#fff',
      focus: '#fff',
      selected: '#fff',
    },
  },
  components: {
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#5c5c5c',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        button: {
          '&:hover': {
            backgroundColor: '#5c5c5c',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#5c5c5c',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        outlined: {
          color: '#fff',
        },
        contained: {
          color: '#fff',
        },
      },
    },
  },
})
